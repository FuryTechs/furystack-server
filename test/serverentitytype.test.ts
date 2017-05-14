import * as chai from 'chai';
import { EndpointEntityType, ForeignKey, ModelDescriptorStore, PrimaryKey, Property } from 'furystack-core';
import { suite, test } from 'mocha-typescript';
import { ServerEntityType } from '../src/ServerScoped/index';
import { TestHelpers } from './';

class EntityTypeTestClass {
    @Property
    public Value: string;
}
@suite()
export class ServerEntityTypeTest {

    @test('Should be constructed')
    public Construct() {
        const et = new EndpointEntityType('TestClass', ModelDescriptorStore.GetDescriptor(EntityTypeTestClass));
        const entityType = new ServerEntityType(et);
    }

    @test('Should be constructed')
    public ImplementAction() {
        const et = new EndpointEntityType('TestClass', ModelDescriptorStore.GetDescriptor(EntityTypeTestClass));
        et.CustomAction('customAction', 'GET', Number, Number);
        const entityType = new ServerEntityType(et);
        const action = entityType.ImplementAction('customAction', async (arg, req) => {
            return 1;
        });
    }

    @test('getModelDescriptor should return descriptor')
    public getModelDescriptor() {
        const descriptor = ModelDescriptorStore.GetDescriptor(EntityTypeTestClass);
        const et = new EndpointEntityType('TestClass', descriptor);
        const entityType = new ServerEntityType(et);

        chai.expect(entityType.ModelDescriptor).to.be.eq(descriptor);
    }
}
