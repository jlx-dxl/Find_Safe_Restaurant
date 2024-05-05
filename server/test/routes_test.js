let chai, expect;

before(async function() {
  chai = await import('chai');
  expect = chai.expect;
});

const sinon = require('sinon');
const proxyquire = require('proxyquire');

// Remove actual connection setup and use mocking/stubbing instead
let connectionStub, routes;

beforeEach(() => {
  // Stub the MySQL connection
  connectionStub = {
    connect: sinon.stub(), // Stub the connect method if it's used in the routes
    query: sinon.stub()
  };

  // Use proxyquire to inject your stubbed connection
  routes = proxyquire('../routes', {
    'mysql': { createConnection: () => connectionStub }
  });
});

afterEach(() => {
  sinon.restore(); // Resets the state of all stubs
});



describe('getRestaurantInfo', function() {
    before(function() {
      // Ensure connectionStub is initialized before using it
      connectionStub = {
        query: sinon.stub()
      };
      // Setup the stub response
      connectionStub.query.withArgs(sinon.match.string, sinon.match.array)
        .yields(null, [{ restaurant_id: 1, restaurant_name: 'Test Restaurant', restaurant_address: '123 Test St' }]);
    });
  
    it('should return restaurant info when provided with a valid restaurant ID', async function() {
      let req = { query: { resID: 1 } };
      let res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
  
      await routes.getRestaurantInfo(req, res);
      expect(res.json.calledWith(sinon.match({ restaurant_id: 1 }))).to.be.true;
    });
  
    after(function() {
      // Reset stubs if needed, or clean up
      connectionStub.query.resetBehavior();
    });
  });

describe('searchRestaurant', function() {
    before(function() {
      // Ensure connectionStub is initialized before using it
      connectionStub = {
        query: sinon.stub()
      };
      // Setup the stub response
      connectionStub.query.withArgs(sinon.match.string, sinon.match.array)
        .yields(null, [{ restaurant_id: 1, restaurant_name: 'Test Restaurant', restaurant_address: '123 Test St' }]);
    });

    it('should return a list of restaurants based on search criteria', async function() {
        let req = { query: { searchStr: 'Test', page: 1, pageSize: 10 } };
        let res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
        };

        await routes.searchRestaurant(req, res);
        expect(res.json.calledOnce).to.be.true;
        expect(res.json.firstCall.args[0]).to.have.property('totalResults', 1);
    });

    after(function() {
      // Reset stubs if needed, or clean up
      connectionStub.query.resetBehavior();
    });
  });

  describe('getInspectionScore', function() {
      it('should return the inspection score for a valid restaurant ID', async function() {
        connectionStub.query.yields(null, [{ inspectionScore: 85 }]);
    
        let req = { query: { resID: 1 } };
        let res = {
          json: sinon.spy(),
          status: sinon.stub().returnsThis()
        };
    
        await routes.getInspectionScore(req, res);
        expect(res.json.calledWith(sinon.match.has('inspectionScore', 85))).to.be.true;
      });
    });

  describe('getCrimeNearRes', function() {
    it('should return crimes near the specified restaurant', async function() {
      connectionStub.query.yields(null, [{ crime_id: 101, crime_type: 'Theft', distance: 0.3 }]);
  
      let req = { query: { resID: 1, distance: 0.5 } };
      let res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
  
      await routes.getCrimeNearRes(req, res);
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0][0]).to.have.property('crime_type', 'Theft');
    });
  });

  describe('getSafetyScore', function() {
    it('should return the safety score for a valid restaurant ID', async function() {
      connectionStub.query.yields(null, [{ safetyScore: 80 }]);
  
      let req = { query: { resID: 1 } };
      let res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
  
      await routes.getSafetyScore(req, res);
      expect(res.json.calledWith(sinon.match.has('safetyScore', 80))).to.be.true;
    });
  });

  describe('getRestaurantInspection', function() {
    it('should return inspection data for a valid restaurant ID', async function() {
      connectionStub.query.yields(null, [
        { inspection_id: 1, inspection_date: '2023-01-01', result: 'Passed' }
      ]);
  
      let req = { query: { resID: 1 } };
      let res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
  
      await routes.getRestaurantInspection(req, res);
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0][0]).to.have.property('inspection_date', '2023-01-01');
    });
  });

  describe('getNearbyRestaurant', function() {
    it('should return nearby restaurants for a valid restaurant ID', async function() {
      connectionStub.query.onFirstCall().yields(null, { restaurant_latitude: 40.7128, restaurant_longitude: -74.0060 });
      connectionStub.query.onSecondCall().yields(null, [{ restaurant_id: 2, distance: 0.4 }]);
      connectionStub.query.onThirdCall().yields(null, [{ total: 1 }]);
  
      let req = {
        query: { resID: 1, distance: 1, page: 1, pageSize: 10, sortType: 'distance', sortOrder: 'asc' }
      };
      let res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
  
      await routes.getNearbyRestaurant(req, res);
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('totalPages', 1);
    });
  });

  describe('getCrimeByID', function() {
    it('should return crime data when provided with a valid crime ID', async function() {
      connectionStub.query.yields(null, [
        { crime_id: 101, crime_type: 'Theft', crime_date: '2023-01-01' }
      ]);
  
      let req = { query: { crimeID: 101 } };
      let res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
  
      await routes.getCrimeByID(req, res);
      expect(res.json.calledWith(sinon.match.array.deepEquals([{ crime_id: 101, crime_type: 'Theft' }]))).to.be.true;
    });
  });

  describe('getRestaurantOverallScore', function() {
    it('should return the overall score for a valid restaurant ID', async function() {
      connectionStub.query.yields(null, [{ inspectionScore: 85, safetyScore: 75 }]);
  
      let req = { query: { resID: 1 } };
      let res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
  
      await routes.getRestaurantOverallScore(req, res);
      expect(res.json.calledWith(sinon.match.has('overallScore', (85 + 75) / 2))).to.be.true;
    });
  });

  describe('getCrimeRankByID', function() {
    it('should return crime rank details for a valid crime ID', async function() {
      connectionStub.query.yields(null, [
        { crime_type: 'Theft', danger_score: 7 }
      ]);
  
      let req = { query: { crimeID: 101 } };
      let res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };
  
      await routes.getCrimeRankByID(req, res);
      expect(res.json.calledWith(sinon.match.has('danger_score', 7))).to.be.true;
    });
  });


