export type FormatDesc = {
    format: GLenum;
    internal: GLenum;
    type: GLenum;
};
export default class PixelFormats {
    readonly gl: WebGLRenderingContext | WebGL2RenderingContext;
    EXT_texture_float: OES_texture_float | null;
    EXT_texture_half_float: OES_texture_half_float | null;
    EXT_texture_half_float_linear: OES_texture_half_float_linear | null;
    EXT_texture_float_linear: OES_texture_float_linear | null;
    EXT_color_buffer_float: any;
    EXT_color_buffer_half_float: any;
    WEBGL_depth_texture: any;
    private readonly _availables;
    private readonly _renderables;
    readonly RGB8: FormatDesc;
    readonly RGBA8: FormatDesc;
    readonly RGB32F: FormatDesc;
    readonly RGBA32F: FormatDesc;
    readonly RGB16F: FormatDesc;
    readonly RGBA16F: FormatDesc;
    readonly A2B10G10R10: FormatDesc;
    constructor(gl: WebGLRenderingContext | WebGL2RenderingContext);
    static getInstance(gl: WebGLRenderingContext | WebGL2RenderingContext): PixelFormats;
    dispose(): void;
    hasDepthTexture(): boolean;
    isAvailable(format: GLenum, type: GLenum, internal?: GLenum): boolean;
    isRenderable(format: GLenum, type: GLenum, internal?: GLenum): boolean;
    getRenderableFormat(configs: FormatDesc[]): FormatDesc | null;
    private _testAvailable;
    private _testRenderable;
}
