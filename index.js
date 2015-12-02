'use strict';

const _ = require('lodash');
const path = require('path');

function asPaginatedItems (posts, summaryLimit) {
    return posts.map((post, idx) => ({
        post,
        displayAsSummary: idx < summaryLimit
    }));
}

function paginate (filePath, collection, fileName, files, perPage) {
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
        prev: clone,
        year: latestYear,
        posts: asPaginatedItems(postsByYear[latestYear], perPage)
    };

    years.forEach((year, idx) => {
        if (idx === 0) {
            return;
        }

        const posts = postsByYear[year];
        const cloneName = baseName + '-' + (idx+1) + ext;

        clone = _.clone(origFile, true, (value) => {
            if (Buffer.isBuffer(value)) {
                return value.slice();
            }
        });

        last.pagination.next = clone;
        clone.pagination.year = year;
        clone.pagination.prev = last;
        clone.pagination.posts = asPaginatedItems(posts, perPage);

        files[cloneName] = clone;

        last = clone;
    });
}

module.exports = function pagination(opts) {
    opts = opts || {};
    const perPage = opts.perPage || 10;

    return function(files, metalsmith, done) {
        const metadata      = metalsmith.metadata();
        const collections   = metadata.collections;

        let colName, file, filePath;

        for (file in files) {
            colName = files[file].paginate;
            filePath = opts.path;
            if (colName) {
                if (filePath) {
                    filePath = filePath.replace(':collection', colName);
                }

                paginate(filePath, collections[colName], file, files, opts.perPage);
            }
        }

        done();
    }
};
