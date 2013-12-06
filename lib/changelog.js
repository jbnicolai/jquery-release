var fs = require( "fs" );

module.exports = function( Release ) {

Release.define({
	_generateChangelog: function( callback ) {
		Release._generateIssueChangelog(function( error, issueChangelog ) {
			if ( error ) {
				return callback( error );
			}

			var changelogPath = Release.dir.base + "/changelog",
				changelog = Release.changelogShell() +
					Release._generateCommitChangelog() +
					issueChangelog;

			fs.writeFileSync( changelogPath, changelog );
			console.log( "Stored changelog in " + changelogPath.cyan + "." );

			callback( null );
		});
	},

	changelogShell: function() {
		return "";
	},

	_generateCommitChangelog: function() {
		var commits,
			commitRef = "[%h](http://github.com/jquery/" + Release.project + "/commit/%H)",
			fullFormat = "* %s (TICKETREF, " + commitRef + ")",
			ticketUrl = Release.issueTracker === "trac" ?
				"http://bugs." + Release.project + ".com/ticket/" :
				"https://github.com/jquery/" + Release.project + "/issue/";

		console.log( "Adding commits..." );
		commits = Release.gitLog( fullFormat );

		console.log( "Adding links to tickets..." );
		return commits

			// Add ticket references
			.map(function( commit ) {
				var tickets = [];

				commit.replace( /Fix(?:e[sd])? #(\d+)/g, function( match, ticket ) {
					tickets.push( ticket );
				});

				return tickets.length ?
					commit.replace( "TICKETREF", tickets.map(function( ticket ) {
						return "[#" + ticket + "](" + ticketUrl + ticket + ")";
					}).join( ", " ) ) :

					// Leave TICKETREF token in place so it's easy to find commits without tickets
					commit;
			})

			// Sort commits so that they're grouped by component
			.sort()
			.join( "\n" ) + "\n";
	},

	_generateIssueChangelog: function( callback ) {
		return Release.issueTracker === "trac" ?
			Release._generateTracChangelog( callback ) :
			Release._generateGithubChangelog( callback );
	}
});

};
