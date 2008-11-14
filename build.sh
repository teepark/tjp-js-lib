#!/usr/bin/env sh

HERE=`dirname $0`
[ -h $HERE ] && HERE=`dirname $(readlink $0)`
SRC=$HERE/src
BUILD=$HERE/build
WRAP=$HERE/wrap

[ -d $BUILD ] || mkdir $BUILD

publish () {
	out=`basename $1 .js`
	shift

	echo "publishing '$@' to $out.js"
	cat $@ > $BUILD/$out.js
	jscompress $@ > $BUILD/$out-compress.js
	jsmin $@ > $BUILD/$out-min.js
	jspack $@ > $BUILD/$out-pack.js
}

# full library
publish js-lib-full \
	$WRAP/initiate.js \
	$WRAP/startscope.js \
	$SRC/base.js \
	`find $SRC -name '*.js' | grep -v base\.js` \
	$WRAP/endscope.js

# standalone base
publish base-standalone \
	$WRAP/initiate.js \
	$WRAP/startscope.js \
	$SRC/base.js \
	$WRAP/endscope.js

# rest of the standalones
for file in `find $SRC -name '*.js' | grep -v base\.js`; do
	publish `basename $file .js`-standalone \
		$WRAP/startscope.js \
		$file \
		$WRAP/endscope.js
done
