import pytest
import uuid


@pytest.mark.asyncio
async def test_create_rollback_log(client):
    deploy_payload = {
        "app_name": "releaseguard",
        "environment": "production",
        "status": "success",
    }
    deploy_resp = await client.post("/api/deployments", json=deploy_payload)
    deployment_id = deploy_resp.json()["id"]

    payload = {
        "deployment_id": deployment_id,
        "previous_version": "v1.0.0",
        "target_version": "v0.9.5",
        "reason": "Production issue",
        "logged_by": "ops-engineer",
        "status": "completed",
    }
    response = await client.post("/api/rollback-logs", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["previous_version"] == "v1.0.0"
    assert data["status"] == "completed"


@pytest.mark.asyncio
async def test_list_rollback_logs(client):
    response = await client.get("/api/rollback-logs")
    assert response.status_code == 200
    data = response.json()
    assert "rollback_logs" in data
    assert "total" in data


@pytest.mark.asyncio
async def test_get_rollback_log_not_found(client):
    response = await client.get(f"/api/rollback-logs/{uuid.uuid4()}")
    assert response.status_code == 404
