const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');
const cheerio = require('cheerio');
const bodyParser = require("body-parser");

const {app} = require('./../app');
const Icebreaker = require('./../models/icebreaker');

app.use(bodyParser.urlencoded({extended: true}));

describe("GET /icebreakers page", () => {
	it('should give 200', (done) => {
		request(app)
			.get('/icebreakers')
			.expect(200)
			.end(done);
	});
});

describe("GET /icebreakers/new page", () => {
    it('should give a 200', (done) => {
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
                console.log(err);
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
				        console.log(err);
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
    it('should give 200', (done) => {
        Icebreaker.find({}, function(err, icebreakers){
			if(err){
				console.log(err);
			}else{
    			var icebreakerId = icebreakers[icebreakers.length-1]._id.toHexString();
    			request(app)
        		    .get('/icebreakers/' + icebreakerId)
        		    .expect(200)
        		    .end(done);
			}
		});
		
    });
})