#include <node.h>
#include <node_events.h>
#include <assert.h>
#include <string.h>
#include <stdlib.h>
#include <zlib.h>

#define CHUNK 16384

using namespace v8;
using namespace node;


class Gzip : public EventEmitter {
 public:
  static void
  Initialize (v8::Handle<v8::Object> target)
  {
    HandleScope scope;

    Local<FunctionTemplate> t = FunctionTemplate::New(New);

    t->Inherit(EventEmitter::constructor_template);
    t->InstanceTemplate()->SetInternalFieldCount(1);

    NODE_SET_PROTOTYPE_METHOD(t, "init", GzipInit);
    NODE_SET_PROTOTYPE_METHOD(t, "deflate", GzipDeflate);
    NODE_SET_PROTOTYPE_METHOD(t, "end", GzipEnd);

    target->Set(String::NewSymbol("Gzip"), t->GetFunction());
  }

  int GzipInit(int level) {
    int ret;
    /* allocate deflate state */
    strm.zalloc = Z_NULL;
    strm.zfree = Z_NULL;
    strm.opaque = Z_NULL;
    ret = deflateInit2(&strm, level, Z_DEFLATED, 16+MAX_WBITS, 8, Z_DEFAULT_STRATEGY);
    return ret;
  }

  int GzipDeflate(char* data, int data_len, char** out, int* out_len) {
    int ret;
    char* temp;
    int i=1;

    *out = NULL;
    *out_len = 0;
    ret = 0;

    if (data_len == 0)
      return 0;

    while(data_len>0) {    
      if (data_len>CHUNK) {
	strm.avail_in = CHUNK;
      } else {
	strm.avail_in = data_len;
      }

      strm.next_in = (Bytef*)data;
      do {
	temp = (char *)realloc(*out, CHUNK*i +1);
	if (temp == NULL) {
	  return Z_MEM_ERROR;
	}
	*out = temp;
	strm.avail_out = CHUNK;
        strm.next_out = (Bytef*)*out + *out_len;
	ret = deflate(&strm, Z_NO_FLUSH);
	assert(ret != Z_STREAM_ERROR);  /* state not clobbered */
	*out_len += (CHUNK - strm.avail_out);
	i++;
      } while (strm.avail_out == 0);

      data += CHUNK;
      data_len -= CHUNK;
    }
    return ret;
  }


  int GzipEnd(char** out, int*out_len) {
    int ret;
    char* temp;
    int i = 1;

    *out = NULL;
    *out_len = 0;
    strm.avail_in = 0;
    strm.next_in = NULL;

    do {
      temp = (char *)realloc(*out, CHUNK*i);
      if (temp == NULL) {
	return Z_MEM_ERROR;
      }
      *out = temp;
      strm.avail_out = CHUNK;
      strm.next_out = (Bytef*)*out + *out_len;
      ret = deflate(&strm, Z_FINISH);
      assert(ret != Z_STREAM_ERROR);  /* state not clobbered */
      *out_len += (CHUNK - strm.avail_out);
      i++;
    } while (strm.avail_out == 0);
    

    deflateEnd(&strm);
    return ret;
  }


 protected:

  static Handle<Value>
  New (const Arguments& args)
  {
    HandleScope scope;

    Gzip *gzip = new Gzip();
    gzip->Wrap(args.This());

    return args.This();
  }

  static Handle<Value>
  GzipInit (const Arguments& args)
  {
    Gzip *gzip = ObjectWrap::Unwrap<Gzip>(args.This());

    HandleScope scope;

    int level=Z_DEFAULT_COMPRESSION;

    int r = gzip->GzipInit(level);

    return scope.Close(Integer::New(r));
  }

  static Handle<Value>
  GzipDeflate(const Arguments& args) {
    Gzip *gzip = ObjectWrap::Unwrap<Gzip>(args.This());

    HandleScope scope;

    enum encoding enc = ParseEncoding(args[1]);
    ssize_t len = DecodeBytes(args[0], enc);

    if (len < 0) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }
    char* buf = new char[len];
    ssize_t written = DecodeWrite(buf, len, args[0], enc);
    assert(written == len);

    char* out;
    int out_size;
    int r = gzip->GzipDeflate(buf, len, &out, &out_size);

    if (out_size==0) {
      return scope.Close(String::New(""));
    }

    Local<Value> outString = Encode(out, out_size, BINARY);
    free(out);
    return scope.Close(outString);
  }

  static Handle<Value>
  GzipEnd(const Arguments& args) {
    Gzip *gzip = ObjectWrap::Unwrap<Gzip>(args.This());

    HandleScope scope;

    char* out;
    int out_size;
    bool hex_format = false;

    if (args.Length() > 0 && args[0]->IsString()) {
      String::Utf8Value format_type(args[1]->ToString());
    }  


    int r = gzip->GzipEnd( &out, &out_size);

    if (out_size==0) {
      return String::New("");
    }
    Local<Value> outString = Encode(out, out_size, BINARY);
    free(out);
    return scope.Close(outString);

  }


  Gzip () : EventEmitter () 
  {
  }

  ~Gzip ()
  {
  }

 private:

  z_stream strm;
};


class Gunzip : public EventEmitter {
 public:
  static void
  Initialize (v8::Handle<v8::Object> target)
  {
    HandleScope scope;

    Local<FunctionTemplate> t = FunctionTemplate::New(New);

    t->Inherit(EventEmitter::constructor_template);
    t->InstanceTemplate()->SetInternalFieldCount(1);

    NODE_SET_PROTOTYPE_METHOD(t, "init", GunzipInit);
    NODE_SET_PROTOTYPE_METHOD(t, "inflate", GunzipInflate);
    NODE_SET_PROTOTYPE_METHOD(t, "end", GunzipEnd);

    target->Set(String::NewSymbol("Gunzip"), t->GetFunction());
  }

  int GunzipInit() {
    /* allocate inflate state */
    strm.zalloc = Z_NULL;
    strm.zfree = Z_NULL;
    strm.opaque = Z_NULL;
    strm.avail_in = 0;
    strm.next_in = Z_NULL;
    int ret = inflateInit2(&strm, 16+MAX_WBITS);
    return ret;
  }

  int GunzipInflate(const char* data, int data_len, char** out, int* out_len) {
    int ret;
    char* temp;
    int i=1;

    *out = NULL;
    *out_len = 0;

    if (data_len == 0)
      return 0;

    while(data_len>0) {    
      if (data_len>CHUNK) {
	strm.avail_in = CHUNK;
      } else {
	strm.avail_in = data_len;
      }

      strm.next_in = (Bytef*)data;

      do {
	temp = (char *)realloc(*out, CHUNK*i);
	if (temp == NULL) {
	  return Z_MEM_ERROR;
	}
	*out = temp;
        strm.avail_out = CHUNK;
	strm.next_out = (Bytef*)*out + *out_len;
	ret = inflate(&strm, Z_NO_FLUSH);
	assert(ret != Z_STREAM_ERROR);  /* state not clobbered */
	switch (ret) {
	case Z_NEED_DICT:
	  ret = Z_DATA_ERROR;     /* and fall through */
	case Z_DATA_ERROR:
	case Z_MEM_ERROR:
	  (void)inflateEnd(&strm);
	  return ret;
	}
	*out_len += (CHUNK - strm.avail_out);
	i++;
      } while (strm.avail_out == 0);
      data += CHUNK;
      data_len -= CHUNK;
    }
    return ret;

  }


  void GunzipEnd() {
    inflateEnd(&strm);
  }

 protected:

  static Handle<Value>
  New(const Arguments& args) {
    HandleScope scope;

    Gunzip *gunzip = new Gunzip();
    gunzip->Wrap(args.This());

    return args.This();
  }

  static Handle<Value>
  GunzipInit(const Arguments& args) {
    Gunzip *gunzip = ObjectWrap::Unwrap<Gunzip>(args.This());

    HandleScope scope;

    int r = gunzip->GunzipInit();

    return scope.Close(Integer::New(r));
  }


  static Handle<Value>
  GunzipInflate(const Arguments& args) {
    Gunzip *gunzip = ObjectWrap::Unwrap<Gunzip>(args.This());

    HandleScope scope;

    enum encoding enc = ParseEncoding(args[1]);
    ssize_t len = DecodeBytes(args[0], enc);

    if (len < 0) {
      Local<Value> exception = Exception::TypeError(String::New("Bad argument"));
      return ThrowException(exception);
    }

    char* buf = new char[len];
    ssize_t written = DecodeWrite(buf, len, args[0], BINARY);
    assert(written == len);

    char* out;
    int out_size;
    int r = gunzip->GunzipInflate(buf, len, &out, &out_size);

    Local<Value> outString = Encode(out, out_size, enc);
    free(out);
    return scope.Close(outString);
  }

  static Handle<Value>
  GunzipEnd(const Arguments& args) {
    Gunzip *gunzip = ObjectWrap::Unwrap<Gunzip>(args.This());

    HandleScope scope;

    gunzip->GunzipEnd();

    return scope.Close(String::New(""));
  }

  Gunzip () : EventEmitter () 
  {
  }

  ~Gunzip ()
  {
  }

 private:

 z_stream strm;

};

extern "C" void
init (Handle<Object> target) 
{
  HandleScope scope;
  Gzip::Initialize(target);
  Gunzip::Initialize(target);
}
