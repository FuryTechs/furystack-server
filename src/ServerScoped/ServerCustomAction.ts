import { CustomAction } from "furystack-core";

export class ServerCustomAction<TBody, TReturns> extends CustomAction<TBody, TReturns> {
    constructor(t: CustomAction<TBody, TReturns>,
                private readonly innerAction: (argument: TBody, req: Express.Request) => Promise<TReturns>) {
        super(t.name, t.requestType, t.bodyType, t.returnsType);
    }

    public async CallAsync(argument: TBody, req: Express.Request): Promise<TReturns> {
        return await this.innerAction(argument, req);
    }
}
