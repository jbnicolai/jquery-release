module.exports = function( Release ) {

Release.define({
	trac: function( path ) {
		var tracUrl = "http://bugs." + Release.project + ".com",
			result = Release.exec( "curl -s '" + tracUrl + path + "&format=tab'", { silent: true });

		if ( result.code !== 0 ) {
			Release.abort( "Error getting Trac data." );
		}

		return result.output;
	},

	_generateTracChangelog: function( callback ) {
		process.nextTick(function() {
			console.log( "Adding Trac tickets..." );
			var changelog = Release.trac(
				"/query?milestone=" + Release.newVersion + "&resolution=fixed" +
				"&col=id&col=component&col=summary&order=component" ) + "\n";
			callback( null, changelog );
		});
	}
});

};
