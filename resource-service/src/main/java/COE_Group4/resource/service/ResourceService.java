package COE_Group4.resource.service;

import COE_Group4.resource.dto.ResourceDto;
import COE_Group4.resource.entity.Resource;
import COE_Group4.resource.repository.ResourceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ResourceService {

    private final ResourceRepository resourceRepository;

    public ResourceService(ResourceRepository resourceRepository) {
        this.resourceRepository = resourceRepository;
    }

    public Resource createResource(Resource resource) {
        return resourceRepository.save(resource);
    }

    public List<Resource> getAllResources(String type, Boolean available) {
        if (type != null && available != null) {
            return resourceRepository.findByTypeAndAvailable(type, available);
        } else if (type != null) {
            return resourceRepository.findByType(type);
        } else if (available != null) {
            return resourceRepository.findByAvailable(available);
        }
        return resourceRepository.findAll();
    }

    public Resource findById(Long id) {
        return resourceRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found"));
    }

    public Resource updateResource(Long id, Resource updated) {
        Resource resource = findById(id);
        resource.setName(updated.getName());
        resource.setType(updated.getType());
        resource.setLocation(updated.getLocation());
        resource.setLatitude(updated.getLatitude());
        resource.setLongitude(updated.getLongitude());
        resource.setCapacity(updated.getCapacity());
        resource.setOpeningTime(updated.getOpeningTime());
        resource.setClosingTime(updated.getClosingTime());
        resource.setDescription(updated.getDescription());
        resource.setAvailable(updated.getAvailable());
        return resourceRepository.save(resource);
    }

    public void deleteResource(Long id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Resource not found");
        }
        resourceRepository.deleteById(id);
    }

    public List<Resource> getResourcesByOwnerId(Long ownerId) {
        return resourceRepository.findByOwnerId(ownerId);
    }

    public ResourceDto getResourceDtoById(Long id) {
        Resource resource = findById(id);
        ResourceDto dto = new ResourceDto();
        dto.setId(resource.getResourceId());
        dto.setName(resource.getName());
        dto.setBookable(Boolean.TRUE.equals(resource.getAvailable()));
        dto.setOpeningTime(resource.getOpeningTime());
        dto.setClosingTime(resource.getClosingTime());
        return dto;
    }
}
