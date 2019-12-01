interface FormatDesc {
    format: GLenum;
    internal: GLenum;
    type: GLenum;
}
declare class PixelFormats {
    gl: WebGLRenderingContext | WebGL2RenderingContext;
    EXT_texture_float: OES_texture_float | null;
    EXT_texture_half_float: OES_texture_half_float | null;
    EXT_texture_half_float_linear: OES_texture_half_float_linear | null;
    EXT_texture_float_linear: OES_texture_float_linear | null;
    EXT_color_buffer_float: any;
    EXT_color_buffer_half_float: any;
    WEBGL_depth_texture: any;
    _availables: Record<string, boolean>;
    _renderables: Record<string, boolean>;
    RGB8: FormatDesc;
    RGBA8: FormatDesc;
    RGB32F: FormatDesc;
    RGBA32F: FormatDesc;
    RGB16F: FormatDesc;
    RGBA16F: FormatDesc;
    A2B10G10R10: FormatDesc;
    constructor(gl: WebGLRenderingContext | WebGL2RenderingContext);
    static getInstance(gl: WebGLRenderingContext | WebGL2RenderingContext): PixelFormats;
    dispose(): void;
    hasDepthTexture(): boolean;
    isAvailable(format: GLenum, type: GLenum, internal: GLenum): boolean;
    isRenderable(format: GLenum, type: GLenum, internal: GLenum): boolean;
    getRenderableFormat(configs: FormatDesc[]): FormatDesc | null;
    _testAvailable(format: GLenum, type: GLenum, internal: GLenum): boolean;
    _testRenderable(format: GLenum, type: GLenum, internal: GLenum): boolean;
}
export default PixelFormats;
