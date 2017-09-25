/*
 * Copyright (c) 2016-2017 Untu, Inc.
 * This code is licensed under Eclipse Public License - v 1.0.
 * The full license text can be found in LICENSE.txt file and
 * on the Eclipse official site (https://www.eclipse.org/legal/epl-v10.html).
 */

'use strict';

var actors = require('../index');
var chai = require('chai');
var P = require('bluebird');
var os = require('os');

chai.use(require('chai-like'));

var expect = chai.expect;
var testSystem;

describe('Actor configuration', function() {
  afterEach(() => testSystem && testSystem.destroy());

  it('should properly configure actors in forked process', P.coroutine(function*() {
    testSystem = actors({
      config: {
        testRoot: {
          mode: 'forked'
        },
        testGenOne: {
          mode: 'forked',
          clusterSize: 3
        }
      },
      test: true
    });

    /**
     * Test root actor.
     */
    class TestRoot {
      /**
       * Initializes this actor.
       *
       * @param {Actor} selfActor Self actor.
       * @returns {P} Initialization promise.
       */
      initialize(selfActor) {
        return selfActor.createChild({
          name: 'testGenOne'
        });
      }
    }

    var rootActor = yield testSystem.rootActor();
    yield rootActor.createChild(TestRoot);

    var tree = yield rootActor.tree();
    var hostname = os.hostname();

    expect(tree).to.be.like({
      name: 'Root',
      location: {
        hostname: hostname,
        pid: process.pid
      },
      children: [
        {
          name: TestRoot.name,
          children: [
            {
              name: 'testGenOneRoundRobinBalancer',
              children: [
                {
                  name: 'testGenOne'
                },
                {
                  name: 'testGenOne'
                },
                {
                  name: 'testGenOne'
                }
              ]
            }
          ]
        }
      ]
    });
  }));
});