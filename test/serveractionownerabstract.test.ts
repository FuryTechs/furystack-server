import { expect } from "chai";
import { CustomAction, ForeignKey, PrimaryKey } from "furystack-core";
import { ServerActionOwnerAbstract, ServerCustomAction } from "../src/ServerScoped/index";
import { TestHelpers } from "./";

// tslint:disable:max-classes-per-file

class TestClass {
}

class ImplementedActionOwner extends ServerActionOwnerAbstract {
    protected getActionByName<TBody, TReturns>(name: string): CustomAction<TBody, TReturns> {
        return new CustomAction(name, "GET", TestClass, TestClass) as CustomAction<TBody, TReturns>;
    }

}

export const serverActionOwnerAbstractTest = describe("ServerActionOwnerAbstract Tests", () => {
    it("Should be constructed", () => {
        const actionOwner = new ImplementedActionOwner();
        expect(actionOwner).to.be.instanceof(ImplementedActionOwner);
    });

    it("Add and Get Method with implementation", () => {
        const actionOwner = new ImplementedActionOwner();
        actionOwner.ImplementAction<TestClass, TestClass>("testCustomAction", async  (arg, req) => {
            return new TestClass();
        });

        const found = actionOwner.GetActions().find((a) => a.name === "testCustomAction");
        expect(found.name).to.be.eq("testCustomAction");
        expect(found.bodyType).to.be.eq(TestClass);
        expect(found.bodyTypeName).to.be.eq("TestClass");
        expect(found.returnsType).to.be.eq(TestClass);
        expect(found.returnTypeName).to.be.eq("TestClass");
        expect(found.requestType).to.be.eq("GET");
    });

    it("Implementing twice should throw", () => {
        const actionOwner = new ImplementedActionOwner();
        const implementFunc = () => {
            actionOwner.ImplementAction<TestClass, TestClass>("testCustomAction", async  (arg, req) => {
                return new TestClass();
            });
        };
        implementFunc();
        expect(implementFunc).to.be.throw();
    });

    it("Should be executed asynchronously", async () => {
        const actionOwner = new ImplementedActionOwner();
        let hasRun = false;

        actionOwner.ImplementAction<TestClass, TestClass>("testCustomAction", async (arg, req) => {
            hasRun = true;
            return new TestClass();
        });

        await actionOwner.CallAction("testCustomAction", new TestClass(), null);
        expect(hasRun).to.be.eq(true);
    });
});
