#!/usr/bin/env sh

HERE=`dirname $0`
[ -h $HERE ] && HERE=`dirname $(readlink $0)`
SRC=$HERE/src
BUILD=$HERE/build
WRAP=$HERE/wrap

[ -d $BUILD ] || mkdir $BUILD

publish () {
	out=$BUILD/`basename $1 .js`.js
	shift

	echo "publishing $BUILD/`basename $out .js`-*.js"

	cat $WRAP/initiate.js > $out
	for infile in $@; do
		cat $WRAP/startscope.js $infile $WRAP/endscope.js >> $out
	done

	cat $out | jsmin > $BUILD/`basename $out .js`-min.js
	cat $out | jscompress > $BUILD/`basename $out .js`-compress.js
	cat $out | jspack > $BUILD/`basename $out .js`-pack.js
}

# custom combination
if [ $2 ]; then
	out=$1
	shift
	args=$SRC/base.js
	for name in $@; do
		if [ `basename $name .js` != base ]; then
			args+=" $SRC/`basename $name .js`.js"
		fi
	done
	publish $out $args
else
	# full library
	publish js-lib-full $SRC/base.js `find $SRC -name '*.js' | grep -v base\.js | sort`

	# standalone base
	publish base-standalone $SRC/base.js

	# rest of the standalones
	for file in `find $SRC -name '*.js' | grep -v base\.js | sort`; do
		publish `basename $file .js`-standalone $file
	done
fi
