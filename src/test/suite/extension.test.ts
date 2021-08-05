import * as assert from 'assert';
import { Console } from 'console';
import { after } from 'mocha';
import * as Sinon from 'sinon';
import * as chai from 'chai';
var expect = chai.expect;

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
  after(() => {
    vscode.window.showInformationMessage('All tests done!');
  });

  test('Account Key checking', () => {
      assert.strictEqual("B-P-39WP4OY:1-8BYUX",myExtension.getAccountKey());
  });
  test('call create bundle after cetae tar',function (){
    // const spy = Sinon.spy(myExtension.getAccountKey);
    // assert.called(myExtension.activate);
    // // Sinon.assert.called(spy);
    const spy = Sinon.spy(myExtension.getAccountKey);
    
});
});