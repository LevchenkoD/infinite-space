function throttle(fn, wait) {
  var time = Date.now();
  return function () {
    if (time + wait - Date.now() < 0) {
      fn();
      time = Date.now();
    }
  };
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

  var InfiniteSpace = function (Data) {
    /**
     * @param {string} wrapper - wrapper selector.
     * @param {object} fakeContentSize - fake content dimentions
     * @param {number} fakeContentSize.width - fake content width
     * @param {number} fakeContentSize.height - fake content height
     * @param {string} content - content selector.
     * @param {object} contentSize - content dimentions
     * @param {number} contentSize.width - content width
     * @param {number} contentSize.height - content height
     * @param {number} edgeDistance - minimum distance to the edge of the `wrapper` to start resizing
     * @param {number} scrollStep - number of pixels that will be added to the `wrapper` size on each resize step
     * @param {number} scale - wrapper transform scale [0,...,1]
    */

    this.defaultData = {
      wrapper: ".wrapper",
      fakeContent: ".scroll-fake-content",
      content: ".content",
      throttleMs: 50,
      edgeDistance: 50,
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

  InfiniteSpace.prototype.handleDrag = function (position, element) {
    // console.log('InfiniteSpace.handleDrag.position', position);

    var now = new Date().getTime();
    
    if (now - this.lastCall < this.throttleMs){
      return;
    }

    var wrapperWidth = this.isBody ? $(window).width() : this.$wrapper.width(),
      wrapperHeight = this.isBody ? $(window).height() : this.$wrapper.height(),
      fakeContentCenter = getCenter(this.$fakeContent),
      top = position[1] + this.elementMarginTop,
      left = position[0] + this.elementMarginLeft,
      contentLeft = this.$content.position().left,
      contentTop = this.$content.position().top,

      scrollWrapper = this.isBody ? window : this.wrapper,
      
      scrollLeft = Math.max(scrollWrapper.scrollLeft || scrollWrapper.scrollX),
      scrollTop = Math.max(scrollWrapper.scrollTop || scrollWrapper.scrollY),
     
      topDistance = contentTop + top,
      adjustTop = contentTop + top <= this.edgeDistance,
      scrollToTop = contentTop + top <= scrollTop + this.edgeDistance,
      
      bottomDistance = this.$fakeContent.height() - (contentTop + top),
      adjustBottom = this.edgeDistance >= bottomDistance,
      scrollToBottom = contentTop + top >= wrapperHeight + scrollTop - this.edgeDistance,
      
      leftDistance = contentLeft + left * this.scale,
      adjustLeft = this.lastPosition[0] > position[0] && leftDistance <= this.edgeDistance - this.edgeDistance / this.scale,
      scrollToLeft = contentLeft + left <= scrollLeft + this.edgeDistance,
     
      rightDistance = this.$fakeContent.width() - (contentLeft + left),
      adjustRight = this.lastPosition[0] < position[0] && this.edgeDistance >= rightDistance,
      scrollToRight = contentLeft + left >= wrapperWidth + scrollLeft - this.edgeDistance;

      this.lastPosition = position || [0, 0];
      this.lastCall = now;

    // if (adjustTop) {
    //   var newMarginTop = 0;
    //   this.$fakeContent.height(this.$fakeContent.height() + this.edgeDistance);
    //   this.$content.css({ top: this.$content.position().top + this.edgeDistance });
    //   newMarginTop = this.elementMarginTop - this.edgeDistance;

    //   $(element).css({ marginTop: newMarginTop });
    //   this.elementMarginTop = newMarginTop;
    // }
    // if (scrollToTop) {
    //   scrollWrapper.scrollTo(
    //     scrollLeft,
    //     scrollTop - this.scrollStep + (adjustTop ? this.edgeDistance : 0)
    //   );
    // }

    if (adjustLeft) {
      var newMarginLeft = 0;
      
      this.$fakeContent.width(this.$fakeContent.width() + (this.edgeDistance - this.edgeDistance / this.scale));
      this.$content.css({ left: this.$content.position().left / this.scale + (this.edgeDistance)});
      console.log(
        "newleft",
        contentLeft,
        left,
        leftDistance,
        // this.$fakeContent.width() + this.edgeDistance,
        this.scale
      );
      newMarginLeft = this.elementMarginLeft - this.edgeDistance;

      $(element).css({ marginLeft: newMarginLeft });
      this.elementMarginLeft = newMarginLeft;
    }
    if (scrollToLeft) {
      scrollWrapper.scrollTo(
        scrollLeft - ((this.scrollStep + (adjustLeft ? this.edgeDistance : 0))),
        scrollTop / this.scale
      );
    }

    if (adjustRight) {
      this.$fakeContent.width(this.$fakeContent.width() + this.edgeDistance);
    }
    if (scrollToRight) {
      scrollWrapper.scrollTo(scrollLeft + this.scrollStep, scrollTop);
    }

    // if (adjustBottom) {
    //   this.$fakeContent.height(this.$fakeContent.height() + this.edgeDistance);
    // }
    // if (scrollToBottom) {
    //   scrollWrapper.scrollTo(scrollLeft, scrollTop + this.scrollStep);
    // }
  };

  InfiniteSpace.prototype.update = function (data) {
    this.scale = data.scale || this.scale;
  };


  InfiniteSpace.prototype.handleDrop = function (element) {
    var $element = $(element),
      position = $element.position(),
      newTop = position.top + this.elementMarginTop,
      newLeft = position.top + this.elementMarginLeft,
      scrollWrapper = this.isBody ? window : this.wrapper,
      scrollLeft = Math.max(scrollWrapper.scrollLeft || scrollWrapper.scrollX),
      scrollTop = Math.max(scrollWrapper.scrollTop || scrollWrapper.scrollY);

    $element.css({
      top: newTop,
      left: newLeft,
      marginTop: 0,
      marginLeft: 0,
    });

    this.elementMarginTop = 0;
    this.elementMarginLeft = 0;

    this.onSpaceChange({
      contentSize: this.$content.size(),
      fakeContentSize: this.$fakeContent.size(),
      wrapperSize: this.$wrapper.size(),
      scale: this.scale,
      scroll: {
        left: scrollLeft,
        top: scrollTop,
      }
    });
  };

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

    this.onSpaceChange = typeof this.data.onSpaceChange === "function" ?
                            this.data.onSpaceChange :
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
