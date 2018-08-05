'use strict';

const _ = require('lodash');
const path = require('path');

function identity (input) {
    return input;
}

function paginate (filePath, collection, fileName, files, iteratee) {
    const allPosts = collection.filter((colItem) => !!colItem.date);
    const origFile = files[fileName];
    const ext      = path.extname(fileName);
    const baseName = filePath || fileName.substr(0, fileName.lastIndexOf(ext));

    const postsByYear   = _.groupBy(allPosts, (post) => new Date(post.date).getFullYear());
    const years         = Object.keys(postsByYear).sort().reverse();
    const latestYear    = years[0];

    let last = origFile;
    let clone;

    // no posts had date field :(
    if (!years.length) {
        return;
    }

    origFile.pagination = {
        year: latestYear,
        posts: postsByYear[latestYear].map(iteratee)
    };

    years.forEach((year, idx) => {
        if (idx === 0) {
            return;
        }

        const posts = postsByYear[year];
        const cloneName = baseName + '-' + year + ext;

        clone = _.cloneDeepWith(origFile, (value) => {
            if (Buffer.isBuffer(value)) {
                return value.slice();
            }
        });

        last.pagination.next = clone;
        clone.pagination.year = year;
        clone.pagination.prev = last;
        clone.pagination.posts = posts.map(iteratee);

        files[cloneName] = clone;

        last = clone;
    });
}

module.exports = function pagination(opts) {
    const options = Object.assign({
        iteratee: identity
    }, opts);

    return function(files, metalsmith, done) {
        const metadata      = metalsmith.metadata();
        const collections   = metadata.collections;

        let colName, file, filePath;

        for (file in files) {
            colName = files[file].paginate;
            filePath = options.path;
            if (colName) {
                if (filePath) {
                    filePath = filePath.replace(':collection', colName);
                }

                paginate(filePath, collections[colName], file, files, options.iteratee);
            }
        }

        done();
    }
};
