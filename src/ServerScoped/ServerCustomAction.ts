import { CustomAction } from 'furystack-core';

export class ServerCustomAction<TBody, TReturns> extends CustomAction<TBody, TReturns> {
    constructor(t: CustomAction<TBody, TReturns>,
                implementation: (argument: TBody, req: Express.Request) => TReturns) {
        super(t.Name, t.RequestType, t.BodyType, t.ReturnsType);
        this.innerAction = implementation;
    }

    public Call(argument: TBody, req: Express.Request) {
        if (this.innerAction == null) {
            throw Error('Action not implemented!');
        }
        return this.innerAction(argument, req);
    }

    private readonly innerAction: (argument: TBody, req: Express.Request) => TReturns;
}
