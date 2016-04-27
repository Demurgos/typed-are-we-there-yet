import * as test from 'blue-tape';

import {Tracker} from 'are-we-there-yet';

let name = 'test';

test('initialization', (t) => {
  t.plan(1);
  let simple = new Tracker(name);
  t.is(simple.completed(), 0, 'Nothing todo is 0 completion');
});
