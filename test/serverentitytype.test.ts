import { expect } from "chai";
import { EndpointEntityType, ForeignKey, ModelDescriptorStore, PrimaryKey, Property } from "furystack-core";
import { ServerEntityType } from "../src/ServerScoped/index";
import { TestHelpers } from "./";

// tslint:disable:max-classes-per-file

class EntityTypeTestClass {
    @Property
    public value: string;
}

export const serverEntityTypeTests = describe("Server Entity Type", () => {
    it("Should be constructed", () => {
        const et = new EndpointEntityType("TestClass", ModelDescriptorStore.GetDescriptor(EntityTypeTestClass));
        const entityType = new ServerEntityType(et);
    });

    it("Action should be implemented", () => {
        const et = new EndpointEntityType("TestClass", ModelDescriptorStore.GetDescriptor(EntityTypeTestClass));
        et.CustomAction("customAction", "GET", Number, Number);
        const entityType = new ServerEntityType(et);
        const action = entityType.ImplementAction("customAction", async (arg, req) => {
            return 1;
        });
    });

    it("getModelDescriptor should return descriptor", () => {
        const descriptor = ModelDescriptorStore.GetDescriptor(EntityTypeTestClass);
        const et = new EndpointEntityType("TestClass", descriptor);
        const entityType = new ServerEntityType(et);

        expect(entityType.ModelDescriptor).to.be.eq(descriptor);
    });
});
