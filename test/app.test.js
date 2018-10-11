const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');
const cheerio = require('cheerio');
const bodyParser = require("body-parser");

const {app} = require('./../app');
const Icebreaker = require('./../models/icebreaker');
const Comment = require('./../models/comment');

app.use(bodyParser.urlencoded({extended: true}));

describe("GET /icebreakers page", () => {
	it('should return 200', (done) => {
		request(app)
			.get('/icebreakers')
			.expect(200)
			.end(done);
	});
});

describe("GET /icebreakers/new page", () => {
    it('should return 200', (done) => {
        request(app)
            .get('/icebreakers/new')
            .expect(200)
            .end(done);
    })
})

describe('POST /icebreakers route', () => {
    it('should add new icebreaker to database', (done) => {
        var prevLen;
        Icebreaker.find({}, function(err, icebreakers) {
            if(err){
                return done(err);
            }else{
                prevLen = icebreakers.length;
            }
        })
        
        var team = 'team icebreaker';
        var title = 'title icebreaker';
        var text = 'text icebreaker';
        var question = 'question icebreaker';
        
        var icebreaker = {
            team: team,
            title: title,
            text: text,
            question: question
        }
        
        request(app)
            .post('/icebreakers')
            .send({
                team: team,
                title: title,
                text: text,
                question: question
            })
            .end((err) => {
				if(err){
					return done(err);
				}

				Icebreaker.find({}, function(err, icebreakers){
				    if(err){
				        return done(err);
				    }else{
				       console.log('************');
				       console.log(icebreaker);
				       console.log(icebreakers);
				       console.log(prevLen);
				       expect(icebreakers.length).toBe(prevLen+1);
				       
    				// 	expect(icebreakers[prevLen].text).toBe(text);
    					done();  
				    }
				});
			});
    });
})

describe('GET /icebreakers/:id route', () => {
    it('should return 200', (done) => {
        Icebreaker.find({}, function(err, icebreakers){
			if(err){
				return done(err);
			}
    		var icebreakerId = icebreakers[icebreakers.length-1]._id.toHexString();
    		request(app)
    		    .get('/icebreakers/' + icebreakerId)
    		    .expect(200)
    		    .end(done);
			
		});
		
    });
})

describe('GET /icebreakers/:id/edit route', () => {
    it('should return 200', (done) => {
        Icebreaker.find({}, function(err, icebreakers){
			if(err){
				return done(err);
			}
    		var icebreakerId = icebreakers[icebreakers.length-1]._id.toHexString();
            request(app)
                .get('/icebreakers/'+icebreakerId)
                .expect(200)
                .end(done);
		});
    });
})

describe('PUT /icebreakers/:id route', () => {
    it('should update icebreaker', (done) => {
        Icebreaker.find({}, function(err, icebreakers){
			if(err){
				return done(err);
			}else{
    			var icebreakerId = icebreakers[icebreakers.length-1]._id.toHexString();
                request(app)
                    .put('/icebreakers/'+icebreakerId)
                    .send({
                        text: 'UPDATED'
                    })
                    .expect(302)
                    .end((err) => {
                       if(err){
                           return done(err);
                       } 
                       
                       Icebreaker.findById(icebreakerId, function(err, icebreaker) {
                           if(err){
                               return done(err);
                           }
                           expect(icebreaker.text).toBe('UPDATED');
                           done();
                           
                       });
                    });
			}
		});
    });
});

describe('POST /icebreakers/:id/comments', () => {
    it('should add new comment to icebreakers comment array', (done) => {
        var prevLen;
        var icebreakersId;
        var text = 'new test COMMENT';
        Icebreaker.find({}, function(err, icebreakers) {
            if(err){
                return done(err);
            }else{
                prevLen = icebreakers[icebreakers.length-1].comments.length;
                icebreakersId = icebreakers[icebreakers.length-1]._id.toHexString();
                
                request(app)
                    .post('/icebreakers/'+ icebreakersId + '/comments')
                    .send({
                        text: text
                    })
                    .expect(302)
                    .end((err) => {
        				if(err){
        					return done(err);
        				}
        
        				Icebreaker.find({}, function(err, icebreakers){
        				    if(err){
        				        return done(err);
        				    }else{
        				        expect(icebreakers[icebreakers.length-1].comments.length).toBe(prevLen+1);
        				        done();
        				    }
        				});
        			});
            }
        })
    });
})

describe('PUT /icebreakers/:id/comments/:comment_id route', () => {
    it('should update comment on icebreaker', (done) => {
        Icebreaker.find({}, function(err, icebreakers){
			if(err){
				return done(err);
			}else{
    			var prevLen = icebreakers[icebreakers.length-1].comments.length;
                var icebreakersId = icebreakers[icebreakers.length-1]._id.toHexString();
                
                Icebreaker.findById(icebreakersId, function(err, icebreaker) {
                    if(err){
                        console.log(err);
                    }else {
                        var commentId = icebreaker.comments[icebreaker.comments.length-1]._id.toHexString();
                        var text = 'updated comment';
                        request(app)
                            .put('/icebreakers/'+ icebreakersId + '/comments/' + commentId)
                            .send({
                                text: text
                            })
                            .expect(302)
                            .end((err) => {
                				if(err){
                					return done(err);
                				}
                
                				Comment.findById(commentId, function(err, comment){
                				    if(err){
                				        return done(err);
                				    }else{
                				        expect(comment.text).toBe(text);
                				        done();
                				    }
                				});
                			});
                    }
                })
			}
		});
    });
});

describe.skip('DELETE /icebreakers/:id/comments/:comment_id', ()=>{
    it('should delete comment from icebreakers comment array', (done) => {
        var prevLen;
        var icebreakersId;
        Icebreaker.find({}, function(err, icebreakers) {
            if(err){
                return done(err);
            }else{
                prevLen = icebreakers[icebreakers.length-1].comments.length;
                icebreakersId = icebreakers[icebreakers.length-1]._id.toHexString();
                
                Comment.find({}, function(err, comments) {
                    if(err){
                        console.log(err);
                    }else{
                        var commentId =comments[comments.length-1]._id;
                        request(app)
                            .delete('/icebreakers/'+ icebreakersId + '/comments/' + commentId)
                            .expect(302)
                            .end((err) => {
                				if(err){
                					return done(err);
                				}
                
                				Icebreaker.findById(icebreakersId, function(err, icebreaker){
                				    if(err){
                				        return done(err);
                				    }else{
                				        expect(icebreaker.comments.length).toBe(prevLen-1);
                				    
                    					done();  
                				    }
                				});
                			});
                    }
                })
            }
        })
    });
})

describe.skip('DELETE /icebreakers/:id route', () => {
    it('should delete todo', (done) => {
        Icebreaker.find({}, function(err, icebreakers) {
            if(err){
                return done(err);
            }
            var prevLen = icebreakers.length; 
            var icebreakerId = icebreakers[icebreakers.length-1]._id.toHexString();
            request(app)
                .delete('/icebreakers/'+icebreakerId)
                .expect(302)
                .end((err) => {
                    if(err){
                        return done(err);
                    }
                    Icebreaker.find({}, function(err, icebreakers) {
                        if(err){
                            return done(err);
                            }
                        expect(icebreakers.length).toBe(prevLen-1);
                        done();
                            
                        })
                    });            
        })
    })
})

