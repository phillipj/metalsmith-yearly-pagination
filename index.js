'use strict';

const path = require('path');
const groupBy = require('lodash/groupBy');
const cloneDeepWith = require('lodash/cloneDeepWith');

function identity (input) {
    return input;
}

function paginate (filePath, collection, fileName, files, iteratee) {
    const allPosts = collection.filter((colItem) => Boolean(colItem.date));
    const origFile = files[fileName];
    const ext      = path.extname(fileName);
    const baseName = filePath || path.basename(fileName, ext);

    const postsByYear = groupBy(allPosts, (post) => new Date(post.date).getFullYear());
    const years       = Object.keys(postsByYear).sort().reverse();
    const latestYear  = years[0];

    let last = origFile;

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
        const cloneName = `${baseName}-${year}${ext}`;

        const clone = cloneDeepWith(origFile, (value) => {
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

module.exports = function(opts) {
    const options = {iteratee: identity, ...opts};

    return (files, metalsmith, done) => {
        const {collections} = metalsmith.metadata();

        for (const file of Object.keys(files)) {
            const colName = files[file].paginate;
            const filePath = options.path ? options.path.replace(':collection', colName) : '';

            if (colName) {
                paginate(filePath, collections[colName], file, files, options.iteratee);
            }
        }

        done();
    };
};
