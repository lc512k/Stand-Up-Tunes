/* global describe */

var assert = require('assert');
var uploader = require('../uploader');

describe('File System Manager', function () {
    describe('#init()', function () {
        it('should return -1 when the value is not present', function () {
            console.log(uploader);
            assert.equal(-1, [1,2,3].indexOf(5));
            assert.equal(-1, [1,2,3].indexOf(0));
        });
    });
});

// describe('User', function () {
//   describe('#save()', function () {
//     it('should save without error', function (done){
//       var user = new User('Luna');
//       user.save(function (err){
//         if (err) throw err;
//         done();
//       });
//     });
//   });
// });
