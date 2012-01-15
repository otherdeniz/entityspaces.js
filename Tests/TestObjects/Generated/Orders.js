//===============================================================================		
// EntitySpaces Version : 2012.1.0000.0
// Date Generated       : 1/14/2012 8:40:32 PM
//===============================================================================

(function (es) { //myNS = "myNameSpace" ... for example purposes

	if (typeof (es) === undefined) {
		throw "Please Load EntitySpaces.Core First";
	}

	es.objects.Orders = es.defineEntity(function () {

		// core columns
		this.OrderID = ko.observable();
		this.CustomerID = ko.observable();
		this.EmployeeID = ko.observable();
		this.OrderDate = ko.observable();
		this.RequiredDate = ko.observable();
		this.ShippedDate = ko.observable();
		this.ShipVia = ko.observable();
		this.Freight = ko.observable();
		this.ShipName = ko.observable();
		this.ShipAddress = ko.observable();
		this.ShipCity = ko.observable();
		this.ShipRegion = ko.observable();
		this.ShipPostalCode = ko.observable();
		this.ShipCountry = ko.observable();

		// extended columns
		this.esExtendedData = undefined;

		// Hierarchical Properties
		this.OrderDetailsCollectionByOrderID = undefined;
		this.UpToEmployeesByEmployeeID = undefined;
	});

	//#region Prototype Level Information

	es.objects.Orders.prototype.esTypeDefs = {
		OrderDetailsCollectionByOrderID: "OrderDetailsCollection",
		UpToEmployeesByEmployeeID: "Employees"
	};
	
	es.objects.Orders.prototype.esRoutes = {
		commit: { method: 'PUT', url: 'Orders_Save', response: 'entity' },
		loadByPrimaryKey: { method: 'GET', url: 'Orders_LoadByPrimaryKey', response: 'entity' }
	};

	es.objects.Orders.prototype.esColumnMap = {
		'OrderID': 'OrderID',
		'CustomerID': 'CustomerID',
		'EmployeeID': 'EmployeeID',
		'OrderDate': 'OrderDate',
		'RequiredDate': 'RequiredDate',
		'ShippedDate': 'ShippedDate',
		'ShipVia': 'ShipVia',
		'Freight': 'Freight',
		'ShipName': 'ShipName',
		'ShipAddress': 'ShipAddress',
		'ShipCity': 'ShipCity',
		'ShipRegion': 'ShipRegion',
		'ShipPostalCode': 'ShipPostalCode',
		'ShipCountry': 'ShipCountry'
	};

	//#endregion

}(window.es, window.myNS));

(function (es) {

	es.objects.OrdersCollection = es.defineCollection('OrdersCollection', 'Orders');

	//#region Prototype Level Information

	es.objects.OrdersCollection.prototype.esRoutes = {
		commit: { method: 'PUT', url: 'OrdersCollection_Save', response: 'collection' },
		loadAll: { method: 'GET', url: 'OrdersCollection_LoadAll', response: 'collection' }
	};

	//#endregion

}(window.es, window.myNS));
