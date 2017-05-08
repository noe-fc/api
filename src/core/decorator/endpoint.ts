import { EndpointOptions } from "../endpoint-options";
/**
 * Created by Miu on 29/04/2017.
 */
export function Endpoint(options: EndpointOptions) {
    return (target:any) => {
        Reflect.defineMetadata('endpoint', options, target);
    };
}