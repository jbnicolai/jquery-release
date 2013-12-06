var url = require( "url" ),
	github = require( "github" );

module.exports = function( Release ) {

Release.define({
	_githubRequest: function( settings, data, callback ) {
		if ( typeof data === "function" ) {
			callback = data;
			data = null;
		}

		github.request( settings, data, function( error, first, meta ) {
			if ( error ) {
				return callback( error );
			}

			if ( !meta.links || !meta.links.next ) {
				return callback( null, first );
			}

			settings.path = url.parse( meta.links.next ).path;
			Release._githubRequest( settings, data, function( error, next ) {
				if ( error ) {
					return callback( error );
				}

				callback( null, first.concat( next ) );
			});
		});
	},

	_githubMilestone: function( callback ) {
		Release._githubRequest({
			path: "/repos/jquery/" + Release.project + "/milestones"
		}, function( error, milestones ) {
			if ( error ) {
				return callback( error );
			}

			var milestone = milestones.filter(function( milestone ) {
				return milestone.title === Release.newVersion;
			})[ 0 ];

			if ( !milestone ) {
				return callback( new Error( "No milestone found." ) );
			}

			callback( null, milestone.number );
		});
	},

	_generateGithubChangelog: function( callback ) {
		Release._githubMilestone(function( error, milestone ) {
			if ( error ) {
				return callback( error );
			}

			Release._githubRequest({
				path: "/repos/jquery/" + Release.project + "/issues",
			}, {
				milestone: milestone,
				status: "closed"
			}, function( error, issues ) {
				if ( error ) {
					return callback( error );
				}

				var changelog = issues.map(function( issue ) {
					var component = "(none)";

					issues.labels.forEach(function( label ) {
						if ( /^component:/.test( label.name ) ) {
							component = label.name.substring( 11 );
						}
					});

					return [
						"#" + issue.number,
						component,
						issue.title
					].sort(function( a, b ) {
						return a.component > b.component ? 1 : -1;
					}).join( "\t" );
				}).join( "\n" ) + "\n";

				callback( null, changelog );
			});
		});
	}
});

};
