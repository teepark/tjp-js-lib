#!/usr/bin/env sh

# find the needed directories
HERE=`dirname $0`
[ -h $HERE ] && HERE=`readlink $0`
SRC=$HERE/src
BUILD=$HERE/build
WRAP=$HERE/wrap

# make a build directory if we don't already have one
[ -d $BUILD ] || mkdir $BUILD

cat $WRAP/pre.js $SRC/base.js $SRC/cookie.js $SRC/functional.js $SRC/http.js $WRAP/post.js > $BUILD/js-lib-full.js
jscompress $WRAP/pre.js $SRC/base.js $SRC/cookie.js $SRC/functional.js $SRC/http.js $WRAP/post.js > $BUILD/js-lib-full-compress.js
jsmin $WRAP/pre.js $SRC/base.js $SRC/cookie.js $SRC/functional.js $SRC/http.js $WRAP/post.js > $BUILD/js-lib-full-min.js
jspack $WRAP/pre.js $SRC/base.js $SRC/cookie.js $SRC/functional.js $SRC/http.js $WRAP/post.js > $BUILD/js-lib-full-pack.js

if [ -n "$1" ]
then
	OUTFILE=$1
	shift
	ARGS="$WRAP/pre.js $SRC/base.js"
	for name in $@
	do
		ARGS+=" $SRC/$name.js"
	done
	ARGS+=" $WRAP/post.js"

	cat $ARGS > $BUILD/$OUTFILE.js
	jsmin $ARGS > $BUILD/$OUTFILE-min.js
	jscompress $ARGS > $BUILD/$OUTFILE-compress.js
	jspack $ARGS > $BUILD/$OUTFILE-pack.js
fi
