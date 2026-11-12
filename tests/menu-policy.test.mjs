import test from 'node:test';
import assert from 'node:assert/strict';
import { ownerOf, primaryNavigation } from '../veci/js/lib/menu-policy.js';

test('Firmware/OTA always owned by System; IPv6 by Network', () => {
  assert.equal(ownerOf('update'), 'system');
  assert.equal(ownerOf('ota'), 'system');
  assert.equal(ownerOf('ipv6'), 'network');
  assert.equal(ownerOf('firmware'), 'system');
});
test('duplicate update and firmware routes do not appear as separate tabs', () => {
  const input = [
    { id: 'home' }, { id: 'network' }, { id: 'system' },
    { id: 'update' }, { id: 'ota' }, { id: 'firmware' },
    { id: 'devices' }, { id: 'wifi' }, { id: 'internet' }
  ];
  assert.deepEqual(primaryNavigation(input).map(x => x.id),
    ['home', 'network', 'system', 'wifi', 'internet']);
});
test('disabled optional capabilities stay out of the menu', () => {
  assert.deepEqual(primaryNavigation([{id:'home'}, {id:'apps', capability:'apps'}], {apps:false}).map(x=>x.id), ['home']);
});
