package COE_Group4.resource.controller;

import COE_Group4.resource.dto.ResourceDto;
import COE_Group4.resource.entity.Resource;
import COE_Group4.resource.security.UserContext;
import COE_Group4.resource.service.ResourceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
public class ResourceController {

    private final ResourceService resourceService;
    private final UserContext userContext;

    public ResourceController(ResourceService resourceService, UserContext userContext) {
        this.resourceService = resourceService;
        this.userContext = userContext;
    }

    @PostMapping
    public ResponseEntity<Resource> createResource(@RequestBody Resource resource) {
        boolean isAdmin = userContext.isAdmin();
        boolean isServiceProvider = userContext.isServiceProvider();

        if (!isAdmin && !isServiceProvider) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (isServiceProvider) {
            resource.setOwnerId(Long.parseLong(userContext.getUserId()));
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.createResource(resource));
    }

    @GetMapping
    public ResponseEntity<List<Resource>> getResources(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean available) {
        return ResponseEntity.ok(resourceService.getAllResources(type, available));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Resource>> getMyResources() {
        Long userId = Long.parseLong(userContext.getUserId());
        return ResponseEntity.ok(resourceService.getResourcesByOwnerId(userId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> getResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.findById(id));
    }

    @GetMapping("/{id}/dto")
    public ResponseEntity<ResourceDto> getResourceDto(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.getResourceDtoById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Resource> updateResource(@PathVariable Long id, @RequestBody Resource updated) {
        boolean isAdmin = userContext.isAdmin();
        boolean isServiceProvider = userContext.isServiceProvider();

        if (!isAdmin && !isServiceProvider) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (isServiceProvider) {
            Resource existing = resourceService.findById(id);
            Long currentUserId = Long.parseLong(userContext.getUserId());
            if (!currentUserId.equals(existing.getOwnerId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        return ResponseEntity.ok(resourceService.updateResource(id, updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        boolean isAdmin = userContext.isAdmin();
        boolean isServiceProvider = userContext.isServiceProvider();

        if (!isAdmin && !isServiceProvider) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (isServiceProvider) {
            Resource existing = resourceService.findById(id);
            Long currentUserId = Long.parseLong(userContext.getUserId());
            if (!currentUserId.equals(existing.getOwnerId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }

        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}
