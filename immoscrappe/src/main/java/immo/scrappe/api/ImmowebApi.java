package immo.scrappe.api;

import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonMappingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * The Java API offers the ability to send search Query 
 * to immoweb.be.
 * 
 * @author hennroja
 *
 */
public class ImmowebApi {

	static final String DEFAULT_ENCODING = "utf-8";

	public QueryResponse search(SearchQuery config) throws IOException {

		System.out.println(config.query);
		//prepair http request
		URL url = new URL(config.query);
		HttpURLConnection connection;

		connection = (HttpURLConnection) url.openConnection();
		connection.setRequestMethod("GET");
		HttpURLConnection.setFollowRedirects(true);
		connection.addRequestProperty("Accept", "application/vnd.be.immoweb.classifieds.v2.1+json");
		connection.addRequestProperty("x-iw-api-key", "bd0892bb-d350-4876-ac6e-6fbcead09734");

		// fire http request and handle response
		BufferedInputStream bis = new BufferedInputStream(
				connection.getInputStream());
		StringBuffer content = new StringBuffer();

		int read = 0;
		while (true) {
			read = bis.read();
			if (read == -1) {
				break;
			}
			content.append((char) read);
		}

		// strip slashes
		String stripContent = content.toString().replace("\\", "");

		// JSON wrapping
		ObjectMapper objectMapper = new ObjectMapper();
		objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
		System.out.println(stripContent);
		QueryResponse response = null;
		try {
			response = objectMapper.readValue(stripContent,
					QueryResponse.class);
		} catch (JsonParseException e ) {
			e.printStackTrace();
		} catch (JsonMappingException e) {
			e.printStackTrace();
		}
		return response;
	}
	
	private void print(SearchResult s) {
		System.out.println("------ ID: " + s.id + " TYPE: " + s.type
				+ " in " + s.postal + " ------");
		System.out.println("Area: " + s.area + "m^2 with "
				+ s.numBedrooms + " bedroom(s) for " + s.price
				+ " Euro");
		System.out
				.println("LAT: " + s.getLat() + " LON:" + s.getLong());
		System.out.println("Image: " + s.image);
		System.out
				.println("-------------------------------------------------------------------");
		}


}
