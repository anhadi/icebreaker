const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');
const cheerio = require('cheerio');
const bodyParser = require("body-parser");

const {app} = require('./../app');
const Icebreaker = require('./../models/icebreaker');

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
        var text = 'new test icebreaker';
        Icebreaker.find({}, function(err, icebreakers) {
            if(err){
                return done(err);
            }else{
                prevLen = icebreakers.length;
            }
        })
        var text = 'test icebreaker';
        
        request(app)
            .post('/icebreakers')
            .send({
                    text: text
                })
            .end((err) => {
				if(err){
					return done(err);
				}

				Icebreaker.find({}, function(err, icebreakers){
				    if(err){
				        return done(err);
				    }else{
				       expect(icebreakers.length).toBe(prevLen+1);
    					expect(icebreakers[prevLen].text).toBe(text);
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

describe('DELETE /icebreakers/:id route', () => {
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