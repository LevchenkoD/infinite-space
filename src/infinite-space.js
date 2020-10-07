function throttle(fn, wait) {
  var time = Date.now();
  return function () {
    if (time + wait - Date.now() < 0) {
      fn();
      time = Date.now();
    }
  };
}

/** 
 * calculateDrag - calculate adjustments and repositions based on element position
 * @param {object} options - element options
 * @param {array} options.position - drag position array [x,y]
 * @param {array} options.lastPosition - previous drag position array [x,y]
 * @param {number} options.scale - wrapper scale
 * @param {number} options.edgeDistance - minimum distance to the edge of the `wrapper` to start resizing
 * @param {number} options.scrollLeft - wrapper scrollLeft
 * @param {number} options.scrollTop - wrapper scrollTop
 * @param {number} options.wrapperWidth - wrapper width.
 * @param {number} options.wrapperHeight - wrapper height.
 * @param {object} options.contentPosition - content position()
 * @param {number} options.contentWidth - content width
 * @param {number} options.contentHeight - content height
 * @param {object} options.fakeContentPosition - fake content position()
 * @param {object} options.padding - canvas padding. @see InfiniteSpace
 * @param {number} options.fakeContentWidth - fake content width
 * @param {number} options.fakeContentHeight - fake content height
 * @param {number} options.elementHeight - element height
 * @param {number} options.elementWidth - element width
 * @param {number} options.elementWidth - element width
 * @param {number} options.elementPosition - element position()
 * @param {number} options.elementMarginTop - element margin top
 * @param {number} options.elementMarginLeft - element margin left
 * @returns {object}
*/
function calculateDrag(options) {
  var top = options.position[1] + options.elementMarginTop,
    left = options.position[0] + options.elementMarginLeft,
    elementLeft = options.elementPosition.left / options.scale,
    elementTop = options.elementPosition.top / options.scale,
    elementRightSide = elementLeft + options.elementWidth,
    elementBottomSide = elementTop + options.elementHeight,
    contentLeft = options.contentPosition.left / options.scale,
    contentTop = options.contentPosition.top / options.scale,

    topDistance = contentTop + top,

    isMovingToTop = options.lastPosition[1] > options.position[1],
    topDistance = contentTop + top,
    adjustTop = isMovingToTop && options.fakeContentPosition.top + topDistance <= options.edgeDistance + options.padding.top,
    scrollToTop = isMovingToTop && contentTop + top <= options.scrollTop / options.scale + options.edgeDistance,

    isMovingToBottom = options.lastPosition[1] < options.position[1],
    bottomDistance = options.fakeContentPosition.top + options.fakeContentHeight - contentTop - elementBottomSide,
    adjustBottom = isMovingToBottom && options.edgeDistance >= bottomDistance,
    scrollToBottom = isMovingToBottom && options.scrollTop / options.scale + (options.wrapperHeight / options.scale) - (options.position[1] + contentTop + options.elementHeight) - options.elementMarginTop < options.edgeDistance,
    
    isMovingToLeft = options.lastPosition[0] > options.position[0],
    leftDistance = contentLeft + left,
    adjustLeft = isMovingToLeft && options.fakeContentPosition.left + leftDistance <= options.edgeDistance + options.padding.left,
    scrollToLeft = isMovingToLeft && contentLeft + left <= options.scrollLeft / options.scale + options.edgeDistance,

    isMovingToRight = options.lastPosition[0] < options.position[0],
    rightDistance = options.fakeContentPosition.left + options.fakeContentWidth - contentLeft - elementRightSide,
    adjustRight = isMovingToRight && options.edgeDistance >= rightDistance,
    scrollToRight = isMovingToRight && options.scrollLeft / options.scale + (options.wrapperWidth / options.scale) - (options.position[0] + contentLeft + options.elementWidth) - options.elementMarginLeft < options.edgeDistance;
   
  return {
    adjustTop: adjustTop,
    scrollToTop: scrollToTop,

    adjustBottom: adjustBottom,
    scrollToBottom: scrollToBottom,

    adjustLeft: adjustLeft,
    scrollToLeft: scrollToLeft,
    leftDistance: leftDistance,

    adjustRight: adjustRight,
    scrollToRight: scrollToRight,
  };
};

if (typeof module !== 'undefined' && module.exports != null) {
  exports.calculateDrag = calculateDrag;
}

(function ($) {
  "use strict";

  function getScrollCenters(element) {
    var isBody = element.tagName === "BODY";
    return {
      x: element.scrollWidth / 2 - $(isBody ? window : element).width() / 2,
      y: element.scrollHeight / 2 - $(isBody ? window : element).height() / 2,
    };
  }

  /**
   * InfiniteSpace - expand parent size and scroll based on children position
   * @param {Object} Data - instance initial data object.
   * @param {string} Data.wrapper - wrapper selector.
   * @param {object} Data.fakeContentSize - fake content dimentions
   * @param {number} Data.fakeContentSize.width - fake content width
   * @param {number} Data.fakeContentSize.height - fake content height
   * @param {string} Data.content - content selector.
   * @param {object} Data.contentSize - content dimentions
   * @param {number} Data.contentSize.width - content width
   * @param {number} Data.contentSize.height - content height
   * @param {number} Data.onChange [] - fires after space adjust
   * @param {number} Data.edgeDistance [100] - minimum distance to the edge of the `wrapper` to start resizing
   * @param {number} Data.scrollStep [100] - number of pixels that will be added to the `wrapper` size on each resize step
   * @param {number} Data.scale [1] - wrapper transform scale [0,...,1]
   * @param {object} Data.padding [{}] - force padding in calculations. 
   *                                      Makes sence when canvas placed not on x:0,y:0
   * @param {number} Data.padding.top [0] - top padding 
   * @param {number} Data.padding.left [0] - left padding 
   * @param {boolean} Data.disallowNegativePosition [false] - if `true` then adjusting to *top* and *left* is forbidden
  */
  var InfiniteSpace = function (Data) {

    this.defaultData = {
      wrapper: ".wrapper",
      fakeContent: ".scroll-fake-content",
      content: ".content",
      throttleMs: 200,
      edgeDistance: 100,
      scrollStep: 100, //px
      fakeContentSize: null,
      scale: 1,
      lastPosition: [0, 0],
      getMaxTop: function () {
        return 10000;
      },
      getMaxLeft: function () {
        return 10000;
      },
      getMaxRight: function () {
        return 10000;
      },
      getMaxBottom: function () {
        return 10000;
      },
    };

    this.init(Data);
  };


  function getCenter($element, sizeData) {
    var width = sizeData ? sizeData.width : $element.width(),
      height = sizeData ? sizeData.height : $element.height();

    return {
      x: width / 2,
      y: height / 2,
    };
  }

  InfiniteSpace.prototype.centerContent = function () {
    var fakeContentCenter = getCenter(this.$fakeContent, this.fakeContentSize),
        contentWidth = this.contentSize ? this.contentSize.width : this.$content.width(),
        contentHeight = this.contentSize ? this.contentSize.height : this.$content.height(),
        left = fakeContentCenter.x - contentWidth / 2,
        top = fakeContentCenter.y - contentHeight / 2;

		if(this.fakeContentSize){
    	this.$fakeContent.css({
      	width: this.fakeContentSize.width,
        height: this.fakeContentSize.height
      });
    }

    this.$content.css({
      left: left,
      top: top,
      width: contentWidth,
      height: contentHeight
    });
  };


  


  /**
   * handleDrag - handle new element position
   * @param {array} position - new position of dragged element
   * @param {object} element - dragged DOM element
  */
  InfiniteSpace.prototype.handleDrag = function (position, element) {
    var now = new Date().getTime();
    
    if (now - this.lastCall < this.throttleMs){
      return;
    }

    var wrapperWidth = this.isBody ? $(window).width() : this.$wrapper.width(),
      wrapperHeight = this.isBody ? $(window).height() : this.$wrapper.height(),
      
      fakeContentPosition = this.$fakeContent.position(),
      fakeContentWidth = this.$fakeContent.width(),
      fakeContentHeight = this.$fakeContent.height(),
      elementWidth = $(element).width(),
      elementHeight = $(element).height(),
      elementPosition = $(element).position(),
      
      scrollWrapper = this.isBody ? window : this.wrapper,
      scrollLeft = Math.max(scrollWrapper.scrollLeft || scrollWrapper.scrollX),
      scrollTop = Math.max(scrollWrapper.scrollTop || scrollWrapper.scrollY),

      contentPosition = this.$content.position(),
      contentWidth = this.$content.width(),
      contentHeight = this.$content.height(),
    
      result = calculateDrag({
        position: position,
        lastPosition: this.lastPosition,
        scale: this.scale,
        edgeDistance: this.edgeDistance,
        padding: this.padding,

        scrollLeft: scrollLeft,
        scrollTop: scrollTop,
        
        wrapperWidth: wrapperWidth,
        wrapperHeight: wrapperHeight,

        contentPosition: contentPosition,
        contentWidth: contentWidth,
        contentHeight: contentHeight,

        fakeContentPosition: fakeContentPosition,
        fakeContentWidth: fakeContentWidth,
        fakeContentHeight: fakeContentHeight,

        elementPosition: elementPosition,
        elementHeight: elementHeight,
        elementWidth: elementWidth,
        
        elementMarginTop: this.elementMarginTop,
        elementMarginLeft: this.elementMarginLeft,
      });


      this.lastPosition = position || [0, 0];
      this.lastCall = now;

    if (!this.disallowNegativePosition && result.adjustTop) {
      var newMarginTop = 0;
      var height = this.$fakeContent.height();

      console.log('adjustTop', scrollTop, this.lastPosition, position);

      this.$fakeContent.height(height + this.edgeDistance / this.scale);
      this.$content.css({ top: this.$content.position().top / this.scale + this.edgeDistance / this.scale});

      newMarginTop = this.elementMarginTop - this.edgeDistance / this.scale;

      $(element).css({ marginTop: newMarginTop });
      this.elementMarginTop = newMarginTop;
    }
    if (result.scrollToTop) {
      scrollWrapper.scrollTo(
        scrollLeft,
        scrollTop - this.scrollStep + (result.adjustTop ? this.edgeDistance : 0)
      );
    }

    if (!this.disallowNegativePosition && result.adjustLeft) {
      var newMarginLeft = 0;
      var width = this.$fakeContent.width();

      this.$fakeContent.width(width + this.edgeDistance / this.scale);
      this.$content.css({ left: (this.$content.position().left / this.scale + this.edgeDistance / this.scale) });
      console.log('adjustLeft', scrollLeft, this.lastPosition, position);
      
      newMarginLeft = this.elementMarginLeft - this.edgeDistance / this.scale;

      $(element).css({ marginLeft: newMarginLeft});
      this.elementMarginLeft = newMarginLeft;
    }
    if (result.scrollToLeft) {
      scrollWrapper.scrollTo(
        (scrollLeft - (this.scrollStep + (result.adjustLeft ? this.edgeDistance: 0))) ,
        scrollTop
      );
    }

    if (result.adjustRight) {
      console.log('adjustRight', scrollLeft, this.lastPosition, position);
      this.$fakeContent.width(this.$fakeContent.width() + this.edgeDistance * 2);
    }
    if (result.scrollToRight) {
      console.log('scrollRight', scrollLeft, this.lastPosition, position);
      scrollWrapper.scrollTo(scrollLeft + this.scrollStep, scrollTop);
    }

    if (result.adjustBottom) {
      console.log('adjustBottom', scrollTop, this.lastPosition, position);
      this.$fakeContent.height(this.$fakeContent.height() + this.edgeDistance);
    }
    if (result.scrollToBottom) {
      console.log('scrollToBottom', scrollTop, this.lastPosition, position);
      scrollWrapper.scrollTo(scrollLeft, scrollTop + this.scrollStep);
    }
  };

  /**
   * update - update instance with new data
   * @param {object} data - data object
   * @param {number} data.scale - canvas scale [0,1] float
  */
  InfiniteSpace.prototype.update = function (data) {
    this.scale = data.scale || this.scale;
  };

  /**
   * handleDrop - handle element drag end event
   * @param {object} element - dragged DOM element
  */
  InfiniteSpace.prototype.handleDrop = function (element) {
    var self = this,
      $element = $(element),
      position = $element.position(),
      newTop = position.top + this.elementMarginTop,
      newLeft = position.left + this.elementMarginLeft,
      scrollWrapper = this.isBody ? window : this.wrapper,
      scrollLeft = Math.max(scrollWrapper.scrollLeft || scrollWrapper.scrollX),
      scrollTop = Math.max(scrollWrapper.scrollTop || scrollWrapper.scrollY);

    $element.css({
      top: newTop,
      left: newLeft,
      marginTop: 0,
      marginLeft: 0,
    });

    self.elementMarginTop = 0;
    self.elementMarginLeft = 0;
    // console.log('onSpaceChange.pre', self.$content, self.$content.size());
    self.onChange({
      content: {
        size: {
          width: self.$content.width(),
          height: self.$content.height()
        },
        position: self.$content.position()
      },
      fakeContent: {
        size: {
          width: self.$fakeContent.width(),
          height: self.$fakeContent.height()
        },
        position: self.$fakeContent.position()
      },
      wrapper: {
        size: {
          width: self.$wrapper.width(),
          height: self.$wrapper.height()
        },
        position: self.$wrapper.position()
      },
      scale: self.scale,
      scroll: {
        left: scrollLeft,
        top: scrollTop,
      }
    });
  };

  /**
   * init - initialize instance and calculate defaults
   * @param {object} Data - data object
   * @see InfiniteSpace
  */
  InfiniteSpace.prototype.init = function (Data) {
    this.data = Data || this.defaultData;
    this.$wrapper = $(this.data.wrapper || this.defaultData.wrapper);
    this.wrapper = this.$wrapper[0];
    this.isBody = this.wrapper.tagName === "BODY";
    this.$fakeContent = $(
      this.data.fakeContent || this.defaultData.fakeContent
    );
    this.$content = $(this.data.content || this.defaultData.content);
    this.lastScrollTop = this.wrapper.scrollTop;
    this.lastScrollLeft = this.wrapper.scrollLeft;
    this.edgeDistance = this.data.edgeDistance || this.defaultData.edgeDistance;
    this.scrollStep = this.data.scrollStep || this.defaultData.scrollStep;
    this.throttleMs = this.data.throttleMs || this.defaultData.throttleMs;
    this.getMaxTop = this.data.getMaxTop || this.defaultData.getMaxTop;
    this.getMaxLeft = this.data.getMaxLeft || this.defaultData.getMaxLeft;
    this.getMaxRight = this.data.getMaxRight || this.defaultData.getMaxRight;
    this.getMaxBottom = this.data.getMaxBottom || this.defaultData.getMaxBottom;
    this.fakeContentSize = this.data.fakeContentSize || this.defaultData.fakeContentSize;
    this.contentSize = this.data.contentSize || this.defaultData.contentSize;
    this.scale = this.data.scale || this.defaultData.scale;
    this.disallowNegativePosition = typeof this.data.disallowNegativePosition === 'boolean' ? 
                                      this.data.disallowNegativePosition : 
                                      false;

    this.padding = {top: 0, left: 0};

    if(typeof Data.padding === 'object') {
      if(typeof Data.padding.top === 'number'){
        this.padding.top = Data.padding.top; 
      }
      if(typeof Data.padding.left === 'number'){
        this.padding.left = Data.padding.left; 
      }
    }

    this.onChange = typeof this.data.onChange === "function" ?
                            this.data.onChange :
                            function(){};

    this.elementMarginTop = 0;
    this.elementMarginLeft = 0;
		
    this.centerContent();
    
    this.centers = getScrollCenters(this.wrapper);
    this.lastCenters = this.centers;
    this.lastPosition = [0, 0];
    this.lastCall = new Date().getTime();
    
    (this.isBody ? document.documentElement : this.wrapper).scrollTo(
      this.lastCenters.x,
      this.lastCenters.y
    );

    return this;
  };

  window.InfiniteSpace = InfiniteSpace;
})(jQuery);
