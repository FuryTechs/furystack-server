import * as chai from 'chai';
import { CustomAction, ForeignKey, PrimaryKey } from 'furystack-core';
import { suite, test } from 'mocha-typescript';
import { ServerActionOwnerAbstract, ServerCustomAction } from '../src/ServerScoped/index';
import { TestHelpers } from './';

class TestClass {
}

class ImplementedActionOwner extends ServerActionOwnerAbstract {
    protected getActionByName<TBody, TReturns>(name: string): CustomAction<TBody, TReturns> {
        return new CustomAction(name, 'GET', TestClass, TestClass) as CustomAction<TBody, TReturns>;
    }

}

@suite()
export class ServerActionOwnerAbstractTest {

    @test('Should be constructed')
    public Construct() {
        const actionOwner = new ImplementedActionOwner();
    }

    @test('Add and Get Method with implementation')
    public AddAndGetImplementation() {
        const actionOwner = new ImplementedActionOwner();
        actionOwner.ImplementAction<TestClass, TestClass>('testCustomAction', async  (arg, req) => {
            return new TestClass();
        });

        const found = actionOwner.GetActions().find((a) => a.Name === 'testCustomAction');
        chai.expect(found.Name).to.be.eq('testCustomAction');
        chai.expect(found.BodyType).to.be.eq(TestClass);
        chai.expect(found.BodyTypeName).to.be.eq('TestClass');
        chai.expect(found.ReturnsType).to.be.eq(TestClass);
        chai.expect(found.ReturnTypeName).to.be.eq('TestClass');
        chai.expect(found.RequestType).to.be.eq('GET');
    }

    @test('AddAndGetMethodImplementation')
    public ImplementTwiceThrowError() {
        const actionOwner = new ImplementedActionOwner();
        const implementFunc = () => {
            actionOwner.ImplementAction<TestClass, TestClass>('testCustomAction', async  (arg, req) => {
                return new TestClass();
            });
        };
        implementFunc();
        chai.expect(implementFunc).to.be.throw();
    }

    @test('ExecAsync')
    public async ExecAsync() {
        const actionOwner = new ImplementedActionOwner();
        let hasRun = false;

        actionOwner.ImplementAction<TestClass, TestClass>('testCustomAction', async (arg, req) => {
            hasRun = true;
            return new TestClass();
        });

        await actionOwner.CallAction('testCustomAction', new TestClass(), null);
        chai.expect(hasRun).to.be.eq(true);
    }
}
