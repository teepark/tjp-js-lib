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

	which jsmin > /dev/null 2>&1 && cat $out | jsmin > $BUILD/`basename $out .js`-min.js
	which jscompress > /dev/null 2>&1 && cat $out | jscompress > $BUILD/`basename $out .js`-compress.js
	which jspack > /dev/null 2>&1 && cat $out | jspack > $BUILD/`basename $out .js`-pack.js
	#which jscompile > /dev/null 2>&1 && cat $out | jscompile > $BUILD/`basename $out .js`-compile.js
}

usage() {
	cat <<EOF
USAGE:
./build.sh [ <outname> <modulename1>... ]

create a build/ directory and write usable javascript files into it

for every output published, always creates an uncompressed version, then
also writes a compressed version for each utility found of jsmin,
jscompress, jspack, and jscompile.

with *outname* and one or more *modulename*s, only publishes one
javascript module (including writing compressed versions) of the given
outname, and it includes 'base' as well as all the specified module
names.

with no arguments, publishes 'browser' with all modules intended for use
in the browser, 'console' with everything intended for the console, and
<name>-standalone for each individual module (these standalones do not
include 'base', so if you are going to use them you will need to first
include base-standalone).
EOF
}

if [ $1 ]; then
	if [ $2 ]; then # custom combination
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
		usage
	fi
else
	# console-ready
	publish console $SRC/base.js `grep -E '^\/\/context:console' $SRC/* | cut -d: -f1 | sort`

	# browser-ready
	publish browser $SRC/base.js `grep -E '^\/\/context:browser' $SRC/* | cut -d: -f1 | sort`

	# standalone base
	publish base-standalone $SRC/base.js

	# rest of the standalones
	for file in `find $SRC -name '*.js' | grep -v base\.js | sort`; do
		publish `basename $file .js`-standalone $file
	done
fi
