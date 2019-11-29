
/*
  Provide various pixel-format's related capabilities.
*/

interface FormatDesc {
  format   : GLenum,
  internal : GLenum,
  type     : GLenum
}


function isWebgl2(gl: WebGLRenderingContext | WebGL2RenderingContext): gl is WebGL2RenderingContext {
  return (gl as WebGL2RenderingContext).texStorage3D !== undefined;
}


class PixelFormats {
  

  
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


  RGB8       : FormatDesc;
  RGBA8      : FormatDesc;
  RGB32F     : FormatDesc;
  RGBA32F    : FormatDesc;
  RGB16F     : FormatDesc;
  RGBA16F    : FormatDesc;
  A2B10G10R10: FormatDesc;



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


    
  static getInstance( gl : WebGLRenderingContext | WebGL2RenderingContext ) : PixelFormats {
    const agl = gl as any;
    var pf = agl.__pf;
    if( pf === undefined ){
      agl.__pf = pf = new PixelFormats( gl );
    }
    return pf;
  }
  




  /**
   * release this instance and its reference in gl context
   * release all extensions
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
   * return true if Texture with depth pixel format can be created.
   */
  hasDepthTexture(){
    if( isWebgl2( this.gl ))
      return this.isAvailable( this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT, this.gl.DEPTH_COMPONENT24 );
    else
      return this.isAvailable( this.gl.DEPTH_COMPONENT, this.gl.UNSIGNED_INT, this.gl.DEPTH_COMPONENT );
  }


  /**
   *  test if texture allocation with given pf leave gl error
   */
  isAvailable( format : GLenum, type : GLenum, internal : GLenum ) : boolean {

    if( format===undefined || type===undefined ){
      return false;
    }

    if( internal === undefined ) {
      internal = format;
    }

    var cid = _hashPF( format, type, internal );
    if( this._availables[cid] === undefined ){
      this._availables[cid] = this._testAvailable( format, type, internal );
    }
    return this._availables[cid];

  }


  /**
   * Test if given format is color renderable
   * Actually est if FBO with given color format is "FRAMEBUFFER_COMPLETE"
   * /!\ can change bound framebuffer and tex
   */
  isRenderable( format : GLenum, type : GLenum, internal : GLenum ) : boolean {

    if( format===undefined || type===undefined ){
      return false;
    }

    if( internal === undefined ) {
      internal = format;
    }

    const cid = _hashPF( format, type, internal );
    if( this._renderables[cid] === undefined ){
      const available = this.isAvailable( format, type, internal );
      this._renderables[cid] = available && this._testRenderable( format, type, internal );
    }
    return this._renderables[cid];

  }


  /**
   * return the first color-renderable format or null if no one is.
   * @param {Object} [configs] Array of object in the form {format,type,internal}
   * /!\ can leave unbinded framebuffer
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


  _testAvailable( format : GLenum, type : GLenum, internal : GLenum ) : boolean {
    const gl = this.gl;

    // flush errors
    gl.getError();

    const tex = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, tex );
    gl.texImage2D(  gl.TEXTURE_2D, 0, internal, 4, 4, 0, format, type, null );
    gl.deleteTexture( tex );

    return ( gl.getError() === 0 );

  }


  _testRenderable( format : GLenum, type : GLenum, internal : GLenum ) : boolean {
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
function _hashPF( format : GLenum, internal : GLenum, type : GLenum ) : number{
  return format ^ (internal << 8) ^ (type << 16);
}





export = PixelFormats