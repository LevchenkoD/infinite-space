require('jsdom-global')();

let jQuery = require("jquery");
let $ = jQuery(window);
global.$ = $;
global.jQuery = $;

var InfiniteSpace = require('../src/infinite-space.js');

var assert = require('assert');

let defaultCalculateOptions = {
    position: [0, 0],
    lastPosition: [0, 0],
    scale: 1,
    edgeDistance: 100,
    
    scrollLeft: 719,
    scrollTop: 257,
    
    wrapperWidth: 1425,
    wrapperHeight: 507,

    contentPosition: {left: 712.5, top: 253.5},
    contentWidth: 1425,
    contentHeight: 507,

    fakeContentPosition: {left: 0, top: 0},
    fakeContentWidth: 2850,
    fakeContentHeight: 1014,

    elementPosition: {left: 0, top: 0},
    elementHeight: 100,
    elementWidth: 100,
    
    elementMarginTop: 0,
    elementMarginLeft: 0,
};


describe('InfiniteSpace', function () {
    describe('calculateDrag()', function () {

        it('should allow adjust top', function () {

            let options = {
                ...defaultCalculateOptions,
                lastPosition: [0,1],
                elementPosition: {left: -427, top: -186},
                elementMarginTop: -400,
            };
            assert.equal(InfiniteSpace.calculateDrag(options).adjustTop, true);
        });        
        it('should allow scroll top', function () {

            let options = {
                ...defaultCalculateOptions,
                lastPosition: [0,1]
            };
            assert.equal(InfiniteSpace.calculateDrag(options).scrollToTop, true);
        });



        it('should allow adjust left', function () {
            let options = {
                ...defaultCalculateOptions,
                elementPosition: {left: -650, top: 0},
                scrollLeft: 0,
                elementMarginLeft: 0,
                position: [-650,0],
                lastPosition: [-649,0]
            };
            assert.equal(InfiniteSpace.calculateDrag(options).adjustLeft, true);
        });
        it('should allow scroll left', function () {

            let options = {
                ...defaultCalculateOptions,
                lastPosition: [1,0]
            };
            assert.equal(InfiniteSpace.calculateDrag(options).scrollToLeft, true);
        });



        it('should allow adjust right', function () {
            let options = {
                ...defaultCalculateOptions,
                scrollLeft: 1425,
                elementMarginLeft: 0,
                elementPosition: {left: 1949, top: 0},
                position: [1949,0],
                lastPosition: [1948,0]
            };
            // console.log('result', InfiniteSpace.calculateDrag(options));
            assert.equal(InfiniteSpace.calculateDrag(options).adjustRight, true);
        });
        it('should allow scroll right', function () {

            let options = {
                ...defaultCalculateOptions,
                scrollLeft: 705,
                position: [1218,0],
                lastPosition: [1217,0],
            };
            assert.equal(InfiniteSpace.calculateDrag(options).scrollToRight, true);
        });


        it('should allow adjust bottom', function () {
            let options = {
                ...defaultCalculateOptions,
                scrollTop: 522,
                elementPosition: {left: 0, top: 602},
                position: [313,602],
                lastPosition: [312,601]
            };
            assert.equal(InfiniteSpace.calculateDrag(options).adjustBottom, true);
        });
        it('should allow scroll bottom', function () {
            let options = {
                ...defaultCalculateOptions,
                scrollTop: 229,
                elementPosition: {left: 0, top: 294},
                position: [313,294],
                lastPosition: [312,293]
            };
            assert.equal(InfiniteSpace.calculateDrag(options).scrollToBottom, true);
        });

    });
});