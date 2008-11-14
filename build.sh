#!/usr/bin/env sh

HERE=`dirname $0`
[ -h $HERE ] && HERE=`dirname $(readlink $0)`
SRC=$HERE/src
BUILD=$HERE/build
WRAP=$HERE/wrap

[ -d $BUILD ] || mkdir $BUILD

ALL="$WRAP/pre.js $SRC/base.js"
for file in `ls $SRC | grep -v base\.js`
do
	ALL+=" $SRC/$file"
done
ALL+=" $WRAP/post.js"

cat $ALL > $BUILD/js-lib-full.js
jscompress $ALL > $BUILD/js-lib-full-compress.js
jsmin $ALL > $BUILD/js-lib-full-min.js
jspack $ALL > $BUILD/js-lib-full-pack.js

if [ -n "$1" ]
then
	OUTFILE=$1
	shift
	ARGS="$WRAP/pre.js $SRC/base.js"
	for file in $@
	do
		ARGS+=" $SRC/$file.js"
	done
	ARGS+=" $WRAP/post.js"

	cat $ARGS > $BUILD/$OUTFILE.js
	jsmin $ARGS > $BUILD/$OUTFILE-min.js
	jscompress $ARGS > $BUILD/$OUTFILE-compress.js
	jspack $ARGS > $BUILD/$OUTFILE-pack.js
fi
