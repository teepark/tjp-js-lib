#!/usr/bin/env sh

# find the needed directories
HERE=`dirname $0`
[ -h $HERE ] && HERE=`dirname $(readlink $0)`
SRC=$HERE/src
BUILD=$HERE/build
WRAP=$HERE/wrap

# make a build directory if we don't already have one
[ -d $BUILD ] || mkdir $BUILD

FILES=`ls $SRC | grep -v base\.js`
echo $FILES

ALL="$WRAP/pre.js $SRC/base.js"
for file in $FILES
do
	ALL+=" $SRC/$FILE"
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
