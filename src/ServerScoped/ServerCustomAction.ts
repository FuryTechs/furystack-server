import { CustomAction } from 'furystack-core';

export class ServerCustomAction<TBody, TReturns> extends CustomAction<TBody, TReturns> {
    constructor(t: CustomAction<TBody, TReturns>,
                private readonly innerAction: (argument: TBody, req: Express.Request) => Promise<TReturns>) {
        super(t.Name, t.RequestType, t.BodyType, t.ReturnsType);
    }

    public async CallAsync(argument: TBody, req: Express.Request): Promise<TReturns> {
        if (this.innerAction == null) {
            throw Error('Action not implemented!');
        }
        return await this.innerAction(argument, req);
    }
}
