'use strict';

const should   = require('should');

const pagination = require('../');

function dateIn2015 () {
    return new Date(2015, 6, 1);
}

function dateIn2016 (argument) {
    return new Date(2016, 6, 1);
}

describe('Yearly pagination', () => {
    var metalsmith, metadata, files;

    beforeEach((done) => {
        files = {
            'blog.md': {
                paginate: 'posts',
                sidebar: Buffer.from("I'm a sidebar content"),
            }
        };

        metadata = {collections: {posts: []}};

        for (var i = 0; i < 10; i++) {
            const name = 'content/posts/post-' + i + '.md';
            const date = (i < 5) ? dateIn2016() : dateIn2015();

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

    describe('pages', () => {

        it('paginates a collection based on year of the "date" field', (done) => {
            pagination()(files, metalsmith, () => {
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

        it('doesnt create additional pages when collection doesnt contain posts with a "date" field', (done) => {
            metadata.collections.posts.forEach((post) => {
                delete post.date;
                return post;
            });

            pagination()(files, metalsmith, () => {
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

        it('takes care of Buffer properties while creating the virtual file for pagination', (done) => {
            pagination({
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

    describe('navigation', () => {

        it('pagination.next references the next paginated page', (done) => {
            pagination()(files, metalsmith, () => {
                const firstPage = files['blog.md'];
                const secondPage = files['blog-2015.md'];

                firstPage.pagination.next.should.equal(secondPage);
                done();
            });
        });

        it('pagination.prev references the previous paginated page', (done) => {
            pagination()(files, metalsmith, () => {
                const firstPage = files['blog.md'];
                const secondPage = files['blog-2015.md'];

                secondPage.pagination.prev.should.equal(firstPage);
                done();
            });
        });

        it('pagination.prev is not defined for the first page', (done) => {
            pagination()(files, metalsmith, () => {
                const firstPage = files['blog.md'];

                firstPage.pagination.should.not.have.property('prev');
                done();
            });
        });

        it('pagination.next is not defined for the last page', (done) => {
            pagination()(files, metalsmith, () => {
                const lastPage = files['blog-2015.md'];

                lastPage.pagination.should.not.have.property('next');
                done();
            });
        });
    });

    describe('iteratee function', () => {

        it('is given each collection item', (done) => {
            let iterateeCalledWith = [];

            const iterateeFn = (post) => {
                iterateeCalledWith.push(post);
            };

            pagination({
                iteratee: iterateeFn
            })(files, metalsmith, () => {
                iterateeCalledWith.should.not.empty();

                iterateeCalledWith.forEach((post, idx) => {
                    post.title.should.equal(`Post Number ${idx}`);
                });

                done();
            });
        });

        it('return value are used as the pagination.posts values', (done) => {
            const iterateeFn = (post, idx) => {
                return Object.assign({
                    idx,
                    post
                });
            };

            pagination({
                iteratee: iterateeFn
            })(files, metalsmith, () => {
                files['blog.md'].pagination.posts.forEach((post) => {
                    post.should.have.property('idx');
                    post.should.have.property('post');
                });

                done();
            });

        });
    });
});
