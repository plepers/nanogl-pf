/** The description of a pixel format. */
export type FormatDesc = {
  /** The pixel format (`GL_RGB`, `GL_RGBA`, etc.) */
  format   : GLenum,
  /** The pixel internal format */
  internal : GLenum,
  /** The pixel data type (`GL_UNSIGNED_BYTE`, `GL_FLOAT`, etc.) */
  type     : GLenum
}


function isWebgl2(gl: WebGLRenderingContext | WebGL2RenderingContext): gl is WebGL2RenderingContext {
  return (gl as WebGL2RenderingContext).texStorage3D !== undefined;
}

/**
 * This class provides various pixel-format related capabilities.
 */
export default class PixelFormats {
  /** The webgl context this ArrayBuffer belongs to */
  readonly gl: WebGLRenderingContext | WebGL2RenderingContext;

  /**
   * The OES_texture_float webgl extension :
   * exposes floating-point pixel types for textures
   */
  EXT_texture_float            : OES_texture_float             | null;
  /**
   * The OES_texture_half_float webgl extension :
   * adds texture formats with 16- and 32-bit floating-point components
   */
  EXT_texture_half_float       : OES_texture_half_float        | null;
  /**
   * The OES_texture_half_float_linear webgl extension :
   * allows linear filtering with half floating-point pixel types for textures
   */
  EXT_texture_half_float_linear: OES_texture_half_float_linear | null;
  /**
   * The OES_texture_float_linear webgl extension :
   * allows linear filtering with floating-point pixel types for textures
   */
  EXT_texture_float_linear     : OES_texture_float_linear      | null;
  /**
   * The EXT_color_buffer_float webgl extension :
   * adds the ability to render a variety of floating point formats
   */
  EXT_color_buffer_float     : any;
  /**
   * The EXT_color_buffer_half_float webgl extension :
   * adds the ability to render to 16-bit floating-point color buffers
   */
  EXT_color_buffer_half_float: any;
  /**
   * The depth texture webgl extension :
   * defines 2D depth and depth-stencil textures
   */
  WEBGL_depth_texture        : any;

  /**
   * List of pixel formats that have already been tested for texture allocation
   * to be possible or not, and the corresponding result
   */
  private readonly _availables: Record<string, boolean>;
  /**
   * List of pixel formats that have already been tested
   * to be color renderable or not, and the corresponding result
   */
  private readonly _renderables: Record<string, boolean>;

  /** Pixel format preset for RGB8 */
  readonly RGB8       : FormatDesc;
  /** Pixel format preset for RGBA8 */
  readonly RGBA8      : FormatDesc;
  /** Pixel format preset for RGB32F */
  readonly RGB32F     : FormatDesc;
  /** Pixel format preset for RGBA32F */
  readonly RGBA32F    : FormatDesc;
  /** Pixel format preset for RGB16F */
  readonly RGB16F     : FormatDesc;
  /** Pixel format preset for RGBA16F */
  readonly RGBA16F    : FormatDesc;
  /** Pixel format preset for A2B10G10R10 */
  readonly A2B10G10R10: FormatDesc;


  /**
   * @param {WebGLRenderingContext | WebGL2RenderingContext} gl  The webgl context this PixelFormats belongs to
   */
  constructor( gl : WebGLRenderingContext | WebGL2RenderingContext ){
    this.gl = gl;


    // EXTENSIONS
    // ==========

    this.EXT_texture_float             = gl.getExtension('OES_texture_float'              );
    this.EXT_texture_half_float        = gl.getExtension('OES_texture_half_float'         );
    this.EXT_texture_half_float_linear = gl.getExtension('OES_texture_half_float_linear'  );
    this.EXT_texture_float_linear      = gl.getExtension('OES_texture_float_linear'       );
    this.EXT_color_buffer_float        = gl.getExtension('EXT_color_buffer_float'         );
    this.EXT_color_buffer_half_float   = gl.getExtension('EXT_color_buffer_half_float'    );

    this.WEBGL_depth_texture           = gl.getExtension( 'WEBGL_depth_texture' ) ||
                                         gl.getExtension( 'WEBKIT_WEBGL_depth_texture' ) ||
                                         gl.getExtension( 'MOZ_WEBGL_depth_texture' );

    // NORMALIZATION
    // =============


    const agl = gl as any;
    const gl2 = gl as WebGL2RenderingContext;

    // normalize HALF_FLOAT to mimic webgl2 ctx
    if( gl2.HALF_FLOAT === undefined && this.EXT_texture_half_float ){
      agl.HALF_FLOAT = this.EXT_texture_half_float.HALF_FLOAT_OES;
    }

    // normalize UNSIGNED_INT_24_8 to mimic webgl2 ctx
    if( gl2.UNSIGNED_INT_24_8 === undefined && this.WEBGL_depth_texture ){
      agl.UNSIGNED_INT_24_8 = 0x84FA;
    }

    this._availables = {};
    this._renderables  = {};


    // PRESETS
    // =======

    this.RGB8        = FMT( gl.RGB,   gl2.RGB,      gl2.UNSIGNED_BYTE                );
    this.RGBA8       = FMT( gl.RGBA,  gl2.RGBA,     gl2.UNSIGNED_BYTE                );
    this.RGB32F      = FMT( gl.RGB,   gl2.RGB32F,   gl2.FLOAT                        );
    this.RGBA32F     = FMT( gl.RGBA,  gl2.RGBA32F,  gl2.FLOAT                        );
    this.RGB16F      = FMT( gl.RGB,   gl2.RGB16F,   gl2.HALF_FLOAT                   );
    this.RGBA16F     = FMT( gl.RGBA,  gl2.RGBA16F,  gl2.HALF_FLOAT                   );
    this.A2B10G10R10 = FMT( gl.RGBA,  gl2.RGB10_A2, gl2.UNSIGNED_INT_2_10_10_10_REV  );

  }


  /**
   * Create a PixelFormats instance or return the existing one for given webgl context.
   * @param {WebGLRenderingContext | WebGL2RenderingContext} gl  The webgl context
   */
  static getInstance( gl : WebGLRenderingContext | WebGL2RenderingContext ) : PixelFormats {
    const agl = gl as any;
    let pf = agl.__pf;
    if( pf === undefined ){
      agl.__pf = pf = new PixelFormats( gl );
    }
    return pf;
  }





  /**
   * Release this instance and its reference in the webgl context.
   * Also release all extensions.
   */
  dispose(){

    this.EXT_texture_float             = null;
    this.EXT_texture_half_float        = null;
    this.EXT_texture_half_float_linear = null;
    this.EXT_texture_float_linear      = null;
    this.EXT_color_buffer_float        = null;
    this.EXT_color_buffer_half_float   = null;


    const agl = this.gl as any;
    if( agl.__pf === this ){
      delete agl.__pf;
    }

  }


  /**
   * Know whether a texture with depth pixel format can be created or not.
   */
  hasDepthTexture(){
    if( isWebgl2( this.gl ))
      return this.isAvailable( this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT, this.gl.DEPTH_COMPONENT24 );
    else
      return this.isAvailable( this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT, this.gl.DEPTH_COMPONENT );
  }


  /**
   * Know whether texture allocation with given pixel format is possible or throws gl error.
   *
   * **Important :** Using this method can change bound texture.
   *
   * @param {GLenum} [format]  The pixel format (`GL_RGB`, `GL_RGBA`, etc.) to test
   * @param {GLenum} [type]  The pixel data type (`GL_UNSIGNED_BYTE`, `GL_FLOAT`, etc.) to test
   * @param {GLenum} [internal]  The pixel internal format to test, defaults to the `format` parameter value
   */
  isAvailable( format : GLenum, type : GLenum, internal : GLenum = format) : boolean {

    if( format===undefined || type===undefined ){
      return false;
    }

    const cid = _hashPF( format, type, internal );
    if( this._availables[cid] === undefined ){
      this._availables[cid] = this._testAvailable( format, type, internal );
    }
    return this._availables[cid];

  }


  /**
   * Know whether given format is color renderable or not.
   *
   * The result will be positive if an FBO to which we attach a texture that is using the given format has status `GL_FRAMEBUFFER_COMPLETE`.
   *
   * **Important :** Using this method can change bound framebuffer and texture.
   *
   * @param {GLenum} [format]  The pixel format (`GL_RGB`, `GL_RGBA`, etc.) to test
   * @param {GLenum} [type]  The pixel data type (`GL_UNSIGNED_BYTE`, `GL_FLOAT`, etc.) to test
   * @param {GLenum} [internal]  The pixel internal format to test, defaults to the `format` parameter value
   */
  isRenderable( format : GLenum, type : GLenum, internal : GLenum = format ) : boolean {

    if( format===undefined || type===undefined ){
      return false;
    }

    const cid = _hashPF( format, type, internal );
    if( this._renderables[cid] === undefined ){
      const available = this.isAvailable( format, type, internal );
      this._renderables[cid] = available && this._testRenderable( format, type, internal );
    }
    return this._renderables[cid];

  }


  /**
   * Get the first color-renderable format from given list or null if there is none.
   *
   * **Important :** Using this method can change bound framebuffer and texture.
   *
   * @param {FormatDesc[]} configs The list of formats to test
   */
  getRenderableFormat( configs : FormatDesc[] ) : FormatDesc|null {

    for (var i = 0; i < configs.length; i++) {
      var cfg = configs[i];
      if( this.isRenderable( cfg.format, cfg.type, cfg.internal ) ) {
        return cfg;
      }
    }

    return null;
  }


  /**
   * Test if texture allocation with given pixel format is possible or throws gl error.
   *
   * Used by {@link PixelFormats#isAvailable}
   *
   * **Important :** Using this method can change bound texture.
   *
   * @param {GLenum} [format]  The pixel format (`GL_RGB`, `GL_RGBA`, etc.) to test
   * @param {GLenum} [type]  The pixel data type (`GL_UNSIGNED_BYTE`, `GL_FLOAT`, etc.) to test
   * @param {GLenum} [internal]  The pixel internal format to test, defaults to the `format` parameter value
   */
  private _testAvailable( format : GLenum, type : GLenum, internal : GLenum ) : boolean {
    const gl = this.gl;

    // flush errors
    gl.getError();

    const tex = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, tex );
    gl.texImage2D(  gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null );
    gl.deleteTexture( tex );

    return ( gl.getError() === 0 );

  }

  /**
   * Test if given format is color renderable or not.
   *
   * Used by {@link PixelFormats#isRenderable}
   *
   * **Important :** Using this method can change bound framebuffer and texture.
   *
   * @param {GLenum} [format]  The pixel format (`GL_RGB`, `GL_RGBA`, etc.) to test
   * @param {GLenum} [type]  The pixel data type (`GL_UNSIGNED_BYTE`, `GL_FLOAT`, etc.) to test
   * @param {GLenum} [internal]  The pixel internal format to test, defaults to the `format` parameter value
   */
  private _testRenderable( format : GLenum, type : GLenum, internal : GLenum ) : boolean {
    const gl = this.gl;

    const tex = gl.createTexture();

    gl.bindTexture( gl.TEXTURE_2D, tex );
    gl.texImage2D(  gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null );


    const fbo = gl.createFramebuffer();
    gl.bindFramebuffer( gl.FRAMEBUFFER, fbo );
    gl.framebufferTexture2D( gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0 );

    const ok = ( gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE );

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture( gl.TEXTURE_2D, null );

    gl.deleteTexture( tex );
    gl.deleteFramebuffer( fbo );

    return ok;

  }


}





function FMT( format : GLenum, internal : GLenum, type : GLenum ) : FormatDesc {
  return {
    format   : format,
    internal : internal,
    type     : type
  };
}


// use xor as hash complete format
// should be good enought ...
function _hashPF( format : GLenum, internal : GLenum, type : GLenum ) : number {
  return format ^ (internal << 8) ^ (type << 16);
}
