import { MysqlDriver } from "./mysql-driver";
import { Injectable } from "../decorator/injectable";
import { APIError } from "../api-error";
/**
 * Created by miu on 09/05/17.
 */
@Injectable
export abstract class Repository<T> {

    public static NOT_FOUND = "Not Found.";

    constructor(protected db: MysqlDriver) {
    }

    abstract getTable(): string;

    /**
     * Gets all the rows of a given table.
     * @returns {Promise<T[]>|Promise}
     */
    getAll(): Promise<T[]> {
        return new Promise<T[]>((resolve, reject) => {
            this.db.query("SELECT * FROM ??", [this.getTable()])
                .then(resolve)
                .catch(reject);
        });
    }

    /**
     * Gets one row from the database.
     * @param id
     * @param idFieldName
     * @returns {Promise<T>|Promise}
     */
    get(id: number, idFieldName: string = "id"): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.db.query("SELECT * FROM ?? WHERE ?? = ?", [this.getTable(), idFieldName, id]).then(results => {
                if (results.length > 0) {
                    resolve(results[0]);
                } else {
                    reject(new APIError(404, Repository.NOT_FOUND));
                }
            }).catch(reject);
        });
    };

    /**
     * Creates a row in the given table, returning the created row.
     * @param model
     * @param idFieldName
     * @returns {Promise<T>|Promise}
     */
    create(model: T, idFieldName: string = "id"): Promise<T> {
        let parsed = this.parseModel(model);
        return new Promise<T>((resolve, reject) => {
            this.db.query("INSERT INTO ?? SET ?", [this.getTable(), parsed])
                .then(results => this.get(results.insertId, idFieldName)
                    .then(resolve)
                    .catch(reject))
                .catch(reject);
        });
    }

    /**
     * updates the given row, returning the updated row.
     * @param id
     * @param model
     * @param idFieldName
     * @returns {Promise<T>|Promise}
     */
    update(id: number, model: T, idFieldName: string = "id"): Promise <T> {
        let parsed = this.parseModel(model);
        return new Promise<T>((resolve, reject) => {
            this.db.query("UPDATE ?? SET ? WHERE ?? = ?", [this.getTable(), parsed, idFieldName, id]).then(results => {
                if (results.changedRows === 0) {
                    reject(new APIError(404, Repository.NOT_FOUND));
                } else {
                    this.get(id, idFieldName).then(resolve).catch(reject);
                }
            }).catch(reject);
        });
    }

    /**
     * Deletes the given row, resolves with no data if everything went fine.
     * @param id
     * @param idFieldName
     * @returns {Promise<void>|Promise}
     */
    delete(id: number, idFieldName: string = "id"): Promise < void > {
        return new Promise<void>((resolve, reject) => {
            this.db.query("DELETE FROM ?? WHERE ?? = ?", [this.getTable(), idFieldName, id]).then(results => {
                if (results.changedRows === 0) {
                    reject(new APIError(404, Repository.NOT_FOUND));
                } else {
                    resolve();
                }
            }).catch(reject);
        });
    }

    /**
     * Helper to parse an item in order to extract column informations for the database.
     * @param model
     * @returns {{}}
     */
    protected parseModel(model: T): any {
        let obj = {};
        for (let field in model) {
            if (model.hasOwnProperty(field)) {
                let metadata = Reflect.getMetadata("dbRow", model, field);
                if (metadata !== undefined) {
                    if (model[field] !== undefined)
                        obj[metadata] = model[field];
                }
            }
        }
        return obj;
    }
}