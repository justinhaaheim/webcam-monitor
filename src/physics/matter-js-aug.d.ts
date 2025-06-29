// Augment Matter.js types to include methods missing from @types/matter-js
declare namespace Matter {
  namespace Render {
    /**
     * Sets the render `width` and `height`.
     *
     * Updates the canvas accounting for `render.options.pixelRatio`.
     *
     * Updates the bottom right render bound `render.bounds.max` relative to the provided `width` and `height`.
     * The top left render bound `render.bounds.min` isn't changed.
     *
     * Follow this call with `Render.lookAt` if you need to change the render bounds.
     *
     * See also `Render.setPixelRatio`.
     * @method setSize
     * @param {render} render
     * @param {number} width The width (in CSS pixels)
     * @param {number} height The height (in CSS pixels)
     */
    function setSize(render: Render, width: number, height: number): void;

    // /**
    //  * Updates the render bounds to fit the scene.
    //  */
    // function lookAt(
    //   render: Render,
    //   bodies: Body[],
    //   padding?: {x: number; y: number},
    // ): void;
  }
}
