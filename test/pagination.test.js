'use strict';

const should   = require('should');

const pagination = require('../');

function oneYearAgo () {
    const current = new Date();
    return new Date(current.getFullYear() - 1, current.getMonth(), current.getDay());
}

describe('Yearly pagination', () => {
    var metalsmith, metadata, files;

    beforeEach((done) => {
        files = {
            'blog.md': {
                paginate: 'posts',
                sidebar: new Buffer("I'm a sidebar content"),
            }
        };

        metadata = {collections: {posts: []}};

        for (var i = 1; i <= 10; i++) {
            const name = 'content/posts/post-' + i + '.md';
            const date = (i < 5) ? new Date() : oneYearAgo();

            files[name] = {
                title: 'Post Number ' + i,
                collection: 'posts',
                date
            };

            metadata.collections.posts.push(files[name]);
        }

        metalsmith = {
            metadata: () => metadata
        };

        done();
    });

    it('paginates a collection based on year of the "date" field', (done) => {
        pagination({
            summariesPerPage: 2
        })(files, metalsmith, () => {
            var cPages = 0;
            for (var file in files) {
                if (/(blog)/.test(file)) {
                    cPages++;
                }
            }
            cPages.should.equal(2);
            done();
        });
    });

    it('doesnt create paginated pages when collection doesnt contain posts with a "date" field', (done) => {
        metadata.collections.posts.forEach((post) => {
            delete post.date;
            return post;
        });

        pagination({
            summariesPerPage: 2
        })(files, metalsmith, () => {
            let cPages = 0;
            for (var file in files) {
                if (/(blog)/.test(file)) {
                    cPages++;
                }
            }
            // still expect the blog.md to exist
            cPages.should.equal(1);
            done();
        });
    });



    it('has configurable path to paginated pages', (done) => {
        pagination({
            summariesPerPage: 2,
            path: ':collection/page'
        })(files, metalsmith, () => {
            var cPages = 0;
            for (var file in files) {
                if (/(posts\/page-[0-9]+)/.test(file)) {
                    cPages++;
                }
            }
            cPages.should.equal(1);
            done();
        });
    });

    it('takes care of Buffer properties while creating the virtual file for pagination', function (done) {
        pagination({
            summariesPerPage: 2,
            path: ':collection/page'
        })(files, metalsmith, () => {
            var fileObj;

            for (var file in files) {
                if (/(posts\/page-[0-9]+)/.test(file)) {
                    fileObj = files[file];
                    should(fileObj).have.property('sidebar');
                    should(fileObj.sidebar).not.equal(files['blog.md'].sidebar);
                    should(Buffer.isBuffer(fileObj.sidebar)).ok;
                }
            }
            done();
        });
    });
});
