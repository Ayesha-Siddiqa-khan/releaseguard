import pytest


@pytest.mark.asyncio
async def test_create_deployment(client):
    payload = {
        "app_name": "releaseguard",
        "environment": "staging",
        "status": "success",
        "commit_sha": "abc123def456",
        "branch": "main",
        "github_run_id": "99999",
        "triggered_by": "github-actions",
        "release_note": "Test deployment",
        "duration_seconds": 60,
    }
    response = await client.post("/api/deployments", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["app_name"] == "releaseguard"
    assert data["environment"] == "staging"
    assert data["status"] == "success"


@pytest.mark.asyncio
async def test_list_deployments(client):
    response = await client.get("/api/deployments")
    assert response.status_code == 200
    data = response.json()
    assert "deployments" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_create_deployment_invalid_environment(client):
    payload = {
        "app_name": "releaseguard",
        "environment": "invalid",
        "status": "success",
    }
    response = await client.post("/api/deployments", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_deployment_invalid_status(client):
    payload = {
        "app_name": "releaseguard",
        "environment": "staging",
        "status": "invalid",
    }
    response = await client.post("/api/deployments", json=payload)
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_deployment_not_found(client):
    import uuid
    response = await client.get(f"/api/deployments/{uuid.uuid4()}")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_and_get_deployment(client):
    payload = {
        "app_name": "releaseguard",
        "environment": "production",
        "status": "running",
        "commit_sha": "xyz789",
        "branch": "main",
        "triggered_by": "manual",
    }
    create_response = await client.post("/api/deployments", json=payload)
    assert create_response.status_code == 201
    deployment_id = create_response.json()["id"]

    get_response = await client.get(f"/api/deployments/{deployment_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == deployment_id


@pytest.mark.asyncio
async def test_update_deployment(client):
    payload = {
        "app_name": "releaseguard",
        "environment": "staging",
        "status": "running",
        "branch": "develop",
    }
    create_response = await client.post("/api/deployments", json=payload)
    deployment_id = create_response.json()["id"]

    update_response = await client.patch(
        f"/api/deployments/{deployment_id}",
        json={"status": "success", "release_note": "Deployment completed"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["status"] == "success"
    assert update_response.json()["release_note"] == "Deployment completed"
