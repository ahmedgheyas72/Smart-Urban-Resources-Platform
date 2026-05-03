package COE_Group4.booking.client;

import COE_Group4.booking.dto.ResourceDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class ResourceClient {

    private final RestTemplate restTemplate;
    private final String resourceServiceUrl;

    public ResourceClient(
            @Value("${resource.service.url:http://localhost:8081}") String resourceServiceUrl) {
        this.restTemplate = new RestTemplate();
        this.resourceServiceUrl = resourceServiceUrl;
    }

    public ResourceDto getResourceById(Long id) {
        return restTemplate.getForObject(
                resourceServiceUrl + "/api/resources/" + id,
                ResourceDto.class
        );
    }
}
