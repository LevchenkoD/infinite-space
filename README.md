# Infinite Space

Resize `div` as a child being dragged to the edges, thus making it "infinite".

----------

## Example

```javascript

$(function() {
    let $dragme = $('#dragme');
    let infiniteSpaceInstance = new InfiniteSpace({
        wrapper: 'body',
        fakeContentSize: {
            width: 2000,
            height: 1000
        },
        contentSize: {
            width: 800,
            height: 200
        }
    });

    function handleDrag(e, ui) {
        var intervalMS = 300;
        throttle(infiniteSpaceInstance.handleDrag([ui.position.left, ui.position.top], $dragme[0]), intervalMS);
    }

    $dragme.draggable({
        drag: handleDrag
    });
});

```