var MashupPlatform = {};
MashupPlatform.wiring = jasmine.createSpyObj("wiring", ["registerCallback"]);

describe("poi2vCard", function () {

    beforeEach(function () {
        // MashupPlatform.wiring.registerCallback.reset();
    });
    
    it("should map handler to poiInput", function () {
        expect(MashupPlatform.wiring.registerCallback).toHaveBeenCalledWith("poiInput", handlerInputPoi);
    });

    it("should parse inputString", function () {
        // Create Mocks.
        window.Vcard = jasmine.createSpy("Vcard");
        window.Poi = jasmine.createSpy("Poi");
        var poiSpy = jasmine.createSpyObj("poiSpy", ["getData"]);
        window.Poi.andReturn(poiSpy);
        
        // Create parameter
        var json = {
            poi:{}
        };
        var string = JSON.stringify(json);

        // Execute function
        handlerInputPoi(string);

        // Verify expectation
        expect(Poi).toHaveBeenCalledWith(json.poi);
        expect(poiSpy.getData).toHaveBeenCalled();
    });
});
