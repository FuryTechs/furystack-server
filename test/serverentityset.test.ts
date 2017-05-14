import * as chai from 'chai';
import { EndpointEntitySet, EndpointEntityType, ForeignKey, ModelDescriptorStore, PrimaryKey } from 'furystack-core';
import { suite, test } from 'mocha-typescript';
import { InMemoryProvider } from '../src/index';
import { ServerEntitySet } from '../src/ServerScoped/index';
import { TestHelpers } from './';

class TestClass {

}

@suite()
export class ServerEntitySetTest {

    private createEntitySet() {
        const descriptor = ModelDescriptorStore.GetDescriptor(TestClass);
        const entityType = new EndpointEntityType('TestClass', descriptor);
        const builderSet = new EndpointEntitySet('tests', entityType);
        return new ServerEntitySet(builderSet, TestClass, Number);
    }

    @test('Should be constructed')
    public Construct() {
        const entitySet = this.createEntitySet();
    }

    @test('Implement Action')
    public GetActionByName() {
        const descriptor = ModelDescriptorStore.GetDescriptor(TestClass);
        const entityType = new EndpointEntityType('TestClass', descriptor);
        const builderSet = new EndpointEntitySet('tests', entityType);

        builderSet.CustomAction('customAction', 'GET', TestClass, TestClass);

        const entitySet = new ServerEntitySet(builderSet, TestClass, Number);
        const action = entitySet.ImplementAction('customAction', async (arg, req) => {
            return new TestClass();
        });
    }

    @test('setDataProvider')
    public setDataProvider() {
        const entitySet = this.createEntitySet();
        const provider = new InMemoryProvider(TestClass);
        entitySet.SetDataProvider(provider);

        chai.expect(entitySet.DataProvider).to.be.eq(provider);
    }

    @test('setDataProvider twice should throw error')
    public setDataProviderTwiceShouldThrow() {
        const entitySet = this.createEntitySet();
        const provider = new InMemoryProvider(TestClass);
        entitySet.SetDataProvider(provider);

        chai.expect(() => { entitySet.SetDataProvider(provider); }).to.throw();
    }
}
