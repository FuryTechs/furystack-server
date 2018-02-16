import { expect } from "chai";
import { EndpointEntitySet, EndpointEntityType, ForeignKey, ModelDescriptorStore, PrimaryKey } from "furystack-core";
import { InMemoryProvider } from "../src/index";
import { ServerEntitySet } from "../src/ServerScoped/index";
import { TestHelpers } from "./";

// tslint:disable:max-classes-per-file

class TestClass {

}
export const serverEntitySetTest = describe("ServerEntitySet Test", () => {

    const createEntitySet = () => {
        const descriptor = ModelDescriptorStore.GetDescriptor(TestClass);
        const entityType = new EndpointEntityType("TestClass", descriptor);
        const builderSet = new EndpointEntitySet("tests", entityType);
        return new ServerEntitySet(builderSet, TestClass, Number);
    };

    it("Should be constructed", () => {
        const entitySet = createEntitySet();
        expect(entitySet).to.be.instanceof(ServerEntitySet);
    });

    it("Implement Action", () => {
        const descriptor = ModelDescriptorStore.GetDescriptor(TestClass);
        const entityType = new EndpointEntityType("TestClass", descriptor);
        const builderSet = new EndpointEntitySet("tests", entityType);

        builderSet.CustomAction("customAction", "GET", TestClass, TestClass);

        const entitySet = new ServerEntitySet(builderSet, TestClass, Number);
        const action = entitySet.ImplementAction("customAction", async (arg, req) => {
            return new TestClass();
        });
    });

    it("setDataProvider", () => {
        const entitySet = createEntitySet();
        const provider = new InMemoryProvider(TestClass);
        entitySet.SetDataProvider(provider);

        expect(entitySet.DataProvider).to.be.eq(provider);
    });
    it("setDataProvider twice should throw error", () => {
        const entitySet = createEntitySet();
        const provider = new InMemoryProvider(TestClass);
        entitySet.SetDataProvider(provider);

        expect(() => { entitySet.SetDataProvider(provider); }).to.throw();
    });
});
