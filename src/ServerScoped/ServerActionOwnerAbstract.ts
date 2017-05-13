import { CustomAction } from 'furystack-core';
import { ServerCustomAction } from './ServerCustomAction';

export abstract class ServerActionOwnerAbstract {

    protected implementedActions: Array<ServerCustomAction<any, any>>;
    protected abstract getActionByName<TBody, TReturns>(name: string):
        CustomAction<TBody, TReturns>;

    public ImplementAction<TBody, TReturns>(
        actionName: string,
        implementation: (arg: TBody, req: Express.Request) => TReturns) {
            if (this.implementedActions.find((a) => a.Name === actionName)) {
                throw Error(`Action ${actionName} has been already implemented`);
            }
            const action = this.getActionByName(actionName);
            const implemented = new ServerCustomAction(action, implementation);
            this.implementedActions.push(implemented);
            return this;
    }

    public CallAction<TBody, TReturns>(actionName: string, body: TBody, req: Express.Request) {
        return this.implementedActions.find((a) => a.Name === actionName).Call(body, req);
    }
}